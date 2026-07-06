---
title: windbg入门初探心得之--ZwContinue之后给启动新启动的线程下断点绕过反调试技术
abbrlink: 60442
url: /posts/60442.html
date: 2021-02-27 19:26:12
tags:
---

最近在用wgdbg逆向MFC程序，windbg打开的程序一开始进去的时候是会停在ntdll.dll的0xcc也就是`int 3`处。
![在这里插入图片描述](/images/3abae814ef661874ff154febc1967c53.png#pic_center)
之后一边查看栈一边step in和step out，希望能够结束程序的初始化流程，尽快到达程序入口点，当然对于有经验的师傅来说直接使用`bp $exentry` 就能够直接下断在程序入口点。但对于我这种小白来说，喜欢一步步调试，那么我们继续走起。
很快啊，我们看到程序进到了一个函数：
KiUserApcDispacher，在这个函数里面，我们又进入了，ZwContinue，step into 看看：
![在这里插入图片描述](/images/804b387ca1e135af52fc849c8a20ce92.png#pic_center)
之后又从ZwContinue跳到了KiFastSystemCall
![在这里插入图片描述](/images/0032d276e7da375038bdd7d99937f844.png#pic_center)
进入到这个系统调用之后，后面就是内核态的代码了，windbg就不能访问，我们就只能等到内核态的代码结束返回到用户态的时候才能继续单步调试，但问题是我继续按下step into之后后面的程序系统调用完就一直跑下去了，我的调试器根本就没办法跟进上去，这是为什么呢？
后来我查到了[这个帖子](https://reverseengineering.stackexchange.com/questions/8813/how-to-bypass-zwcontinue)，并在black binary师傅的指导下了解到，windows x86程序下软件断点到本质是在下断点处到内存里写入0xcc,而step into单步调试到本质则是通过设置cpu的flag 寄存器里面陷阱标志T位来实现的。
程序在进入到ZwContinue这个函数之后会通过系统调用启动一个新的线程并清空我们flag寄存器里面的陷阱标志T位，导致接下来我们的程序就不能单步调试了，相当于go继续执行。

在那个帖子里面，我们可以了解到ZwContinue这个函数的作用是启动新线程，其中第一个参数`IN PCONTEXT ThreadContext`是一个结构体，表示的是新线程的信息，而在这个结构体里面，有个成员叫做eip会表示新线程的起始地址，我们只要使用命令`bp address`给他下断就可以了。
那么这个结构体的情况如何呢？我们就要去[ntddk.h](https://docs.microsoft.com/en-us/windows-hardware/drivers/ddi/ntddk/ns-ntddk-context)头文件里面去找了:

```cpp
typedef struct _CONTEXT {
  ULONG              ContextFlags;
  ULONG              Dr0;
  ULONG              Dr1;
  ULONG              Dr2;
  ULONG              Dr3;
  ULONG              Dr6;
  ULONG              Dr7;
  FLOATING_SAVE_AREA FloatSave;
  ULONG              SegGs;
  ULONG              SegFs;
  ULONG              SegEs;
  ULONG              SegDs;
  ULONG              Edi;
  ULONG              Esi;
  ULONG              Ebx;
  ULONG              Edx;
  ULONG              Ecx;
  ULONG              Eax;
  ULONG              Ebp;
  ULONG              Eip;
  ULONG              SegCs;
  ULONG              EFlags;
  ULONG              Esp;
  ULONG              SegSs;
  UCHAR              ExtendedRegisters[MAXIMUM_SUPPORTED_EXTENSION];
} CONTEXT;
```
这个结构体里面的ULONG都是4字节的，而里面的FLOATING_SAVE_AREA的数据就要在winsdk的[nti386.h](https://github.com/mic101/windows/blob/master/WRK-v1.2/public/sdk/inc/nti386.h#L482-#L492)查了：
```cpp
typedef struct _FLOATING_SAVE_AREA {
    ULONG   ControlWord;
    ULONG   StatusWord;
    ULONG   TagWord;
    ULONG   ErrorOffset;
    ULONG   ErrorSelector;
    ULONG   DataOffset;
    ULONG   DataSelector;
    UCHAR   RegisterArea[SIZE_OF_80387_REGISTERS];
    ULONG   Cr0NpxState;
} FLOATING_SAVE_AREA;

 ```
这里的SIZE_OF_80387_REGISTERS是80大小。
而我们恰好在这个图里面call zwcontinue之前有push edi，这个edi自然就是我们这个结构体的地址：
![在这里插入图片描述](/images/0242f5c9c9541d88c9ef10b812e8c307.png)
我们使用命令`dd edi`看一下edi指向的结构体的内容：
![在这里插入图片描述](/images/bfa54e3c7d64d9e417d8db45ee74f7c1.png#pic_center)
可以看到edi开始的00010017对应的是结构体里面的ContextFlags。再根据这个图简单算一下，edi+0xb8就是结构成员的`  ULONG              Eip; `的值。
可以看到`dd edi+0xb8`的结果是7c8106f5
那么我们只要在这个地址下断点就好了。
一开始我用的是命令`bp edi+b8`下断点后来发现这实际上是下断点到栈上面去了，这相当于在栈上面插入0xcc。
这就导致了我后来的这个报错：

> (720.474): Access violation - code c0000005 (first chance)
First chance exceptions are reported before any exception handling.
This exception may be expected and handled.
eax=00456ada ebx=7ffd5000 ecx=020fa685 edx=00000082 esi=00c5f76a edi=00c5f6ee
eip=7c8106cc esp=0012fffc ebp=00000280 iopl=0         nv up ei pl nz na po nc
cs=001b  ss=0023  ds=0023  es=0023  fs=0038  gs=0000             efl=00010202
kernel32!CreateThread+0x5:
7c8106cc ff751c          push    dword ptr [ebp+1Ch]  ss:0023:0000029c=????????


这个报错在还没到达断点0x7c8106f5的时候就发生了。
![在这里插入图片描述](/images/6b7d8017d3be87fe4c3412ad05be9ca8.png#pic_center)

正确的下断点方法应该是断在栈上面的这个指针指向的地址，也就是使用命令`bp 7c8106f5`即可。
之后就可以愉快的继续从断点单步了：
![在这里插入图片描述](/images/d49d8010e41bb5022127b25cae262416.png#pic_center)

这是一个普通pe程序的初始化过程，可能很多师傅调试的时候直接从入口点开始调，就没注意这些细节，但事实上这些细节可以拿来做反调试，比如你在程序段里面手动调用ZwContinue那么就能够清空你的陷阱信息，让你不能单步调试，这也就是为什么那个帖子的名字叫做"绕过ZwContinue"。
