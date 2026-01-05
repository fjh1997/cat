---
title: c语言中fgets()和read()的区别以及pwn题目中需要设置setbuf的原理。
date: 2021-01-30 17:00:12
tags:
---

 - fgets是一个c语言函数, read 是一个系统调用（实际上也是libc里面的一个c语言函数，只不过封装了一个系统调用） 。
 -  fgets 读取的数据来自stdin的缓冲区（由read负责读入stdin缓冲区）再写入用户指定的缓冲区, read则是直接读取数据存到用户指定的缓冲区（不经过stdin缓冲区）
 - read不会 fgets 通过文件指针读文件, read 使用文件描述符读文件
 -  fgets 遇到回车就停止读取 而read遇到回车、空格、\x00都不管，它会一直读取你让他读取的字节数。
- fgets把数据拷贝到用户指定的缓冲之后会加一个\x00，read不会加。
以上原理的依据在哪，以调试记录为证：

**这个是调用fgets时候所经历的函数backtrace以及系统调用的参数：**

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/f52e27cd2639bbc583113c015140e85a.png)
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/bf75e89a172e7bb94b7cb7108d482d03.png)
可以看到系统调用read读入的buffer是IO_2_1_stdin的缓冲区，从libc的fgets()到read经历了不少函数帧，而且我们可以尝试不停往管道里写入不包含换行符字符串，会发现，我们每到read阻塞的时候，每写一次，read函数就会返回，但是接着又会继续调用继续阻塞，所以说，一次fgets()可能**会调用多次read**。

**这个是调用read时候所经历的函数backtrace以及系统调用的参数：**
![](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/5c752d4c459de3566617012bf206915c.png)
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/c8d3385451077f9ea81723083694aaab.png)
可以看到系统调用read读入的buffer是用户空间指定的buffer，且read()函数仅仅为libc里面的sys_read系统调用的封装。
顺带一提 getchar()也是调用的read函数，调试如下：

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/793cc351f131a0bd694ded3aaa77be1e.png)
而我们在终端上发送ctrl+c的中断信号后，这个信号称为SIGINT也被read()读入，之后程序就会断在下一个位置：

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/ff25037888508c795d4886e7e1f49e38.png)
可以对比上图的0x40009112bc
我们在终端上发送ctrl+D的EOF信号(windows上是ctrl+z)后，也被getchar()读入,但区别是之后但getchar()函数就不再起作用了，因为getchar读的数据是从文件指针里读，而文件指针指向EOF之后就不再前进了，这也是为什么我们这个程序输入ctrl+D之后会一直返回乱码的原因：
```c
#include <stdio.h>
void main()
{
    int c;
    while (1) {
        c = getchar();            // Get one character from the input
        putchar(c);               // Put the character to the output
    }
}
```
但以下代码就没关系，因为read读入的数据绕过了文件指针，直接读入：
```c
#include <unistd.h>
void main()
{
    int c;
    while (1) {
       read(0,&c,1);            // Get one character from the input
       write(1,&c,1);               // Put the character to the output
    }
}
```
至于为什么以上两个程序在使用方向键的时候会^[[C请参考这篇：
https://www.zhihu.com/question/21518507
如果要让终端不要回车才发送数据可以设置 结构体termios的数据成员c_lflag的ICANON flag。 
[看这里gnu官方](https://www.gnu.org/software/libc/manual/html_node/Canonical-or-Not.html)
关于pwtools发送EOF参考这篇：
- https://github.com/Gallopsled/pwntools/issues/985

假如我们考虑这个命令：
```bash
 command1 | command2
```
以上命令中包含了两个缓冲区标准输入缓冲（stdin buffer）、管道缓冲（pip buffer）
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/1b59c6ded994a80b37162e991593262f.png)


而如果在还没读取完需要的字节数（nbytes）前就已经空了，那么read将分类讨论：



### 在读取一个空管道的情况下：

 1. 此时如果没有进程在往这个管道里写东西（也就是把这个管道关闭了），read()就不报错，返回0，因为空管道的大小是0.
 2. 此时有进程在往这个管道里写东西而且之前设置了O_NONBLOCK 标志, read() 就会报错，并返回-1
 3. 此时有进程在往这个管道里写东西而且之前没设置O_NONBLOCK 标志，或者是这个标志（flag）被清除了，
    调用read的那个线程就会被read阻塞，直到有新数据写过来或者管道关闭(也就是没有任何一个进程往管道里写东西)。

### 在被中断的情况下：

read被中断的时候没有还没有来得及读取任何数据，会报错，返回-1
read被中断的时候已经读取了一些数据，会返回读取的字节数量大小。

### 在读取其他大小不为空的管道（PIPE）、有名管道（FIFO）、文件、终端的时候。

 - 文件大小比nbytes小，返回文件大小
 - 终端一行的数据比nbytes小也就是按了回车，返回这一行数据的大小
 - 管道（FIFO或者PIPE）能够 **即时(immediately)** 提供的数据小于nbytes，返回能够即时提供的数据的大小。



根据以上规则，我们可以推断出，在read等待输入的时候，输入的地方打开了类似管道的数据流，此时线程会被阻塞，而一旦接收到数据，read就**无论后续是否有数据发送过来，立即把当前的数据读取并返回**，所以我们在设置缓冲区的时候，不能设置的过小，不然会导致read读取的数据不全。当然，通过setbuf(0)把缓冲区设置为0，也就是关闭缓冲区也能解决这个问题。

还有一个问题就是搭建pwn题的时候有时候无法立即回显，这是因为我们搭建pwn环境的时候连接程序输出用的是管道而不是像直接启动程序的时候那样用的是终端，对于终端，程序的输出会直接回显，而对于管道或者硬盘那样的文件系统，程序会设置缓冲区，知道缓冲区满了才回显，如我上次写的这篇文章：
https://blog.csdn.net/fjh1997/article/details/105046180


事实上，还有一个缓冲区，他存在在我们的命令行中，那就是终端层（tty或pty）的缓冲区，这个缓冲区就是我们还没有输入回车之前输入的数字，一旦按了回车，这个缓冲区就会清空，然后把数据发送给我们的程序。
根据模式的不同分为“Cooked"和”raw“模式，”Cooked“模式不会输入类似于
 <kbd>Ctrl</kbd><kbd>D</kbd>, <kbd>Ctrl</kbd><kbd>S</kbd>, <kbd>Ctrl</kbd><kbd>U</kbd>, <kbd>Backspace</kbd>这样的字符，一旦检测到这类字符，就会把他们处理掉，而“raw”模式就不会处理这些字符，一旦检测到，就会原封不动的发送过去。可以关于tty的行归程看这篇文章：- 
 - https://blog.csdn.net/dog250/article/details/78818612
源码在这里有：
- https://github.com/torvalds/linux/blob/master/drivers/tty/pty.c
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/d34d0611b27898042fc76c7f037e4984.png)

 详见：
 

 - https://pubs.opengroup.org/onlinepubs/9699919799/functions/read.html 
- http://www.pixelbeat.org/programming/stdio_buffering/   
-  https://unix.stackexchange.com/questions/21752/what-s-the-difference-between-a-raw-and-a-cooked-device-driver
-  https://stackoverflow.com/questions/31856286/getchar-loops-over-eof-when-stdin-provided-through-a-pipe?rq=1

