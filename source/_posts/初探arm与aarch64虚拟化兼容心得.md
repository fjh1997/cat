---
title: 初探arm与aarch64虚拟化兼容心得
abbrlink: 25234
date: 2021-02-28 14:05:21
tags:
---

写在前面：**逆向工程小白，仅供参考，如有错误，欢迎指正**。


armv8主要有三套指令集，依据执行状态（execution state）的不同可以划分为：
```
AArch64   AArch64 状态只支持一套指令集,叫做A64. 
          A64为定长32位的指令集，即每个指令的大小为32bit.
指令集手册：https://developer.arm.com/documentation/dui0801/k/A64-Data-Transfer-Instructions/LDR--register-          
AArch32   AArch32 状态支持两套指令集:
          A32     也是32位定长指令集
          T32     可变长指令集，其中支持两种不同长度的指令一种长度16位一种长度32位，其中16位的指令也称为thumb code
指令集手册：https://developer.arm.com/documentation/dui0473/m/arm-and-thumb-instructions/ldr--register-offset-
```

通过对比我们可以发现同一个指令的格式有较大差异，比如LDR的指令。aarch32是这样的：
```
LDR{type}{cond} Rt, [Rn, ±Rm {, shift}] ;
```
似乎支持正负号。

而aarch64的指令是这样的：
```
LDR <Wt>, [<Xn|SP>, (<Wm>|<Xm>){, <extend> {<amount>}}] ; 32-bit
```
似乎简洁一些。

armv8的cpu将需要运行的一部分程序指令打包为一个PE（Processing Element 简称PE翻译成处理单元好像也可以）并将PE分别划分为四层，EL0~EL3,数字越大，安全等级越高，而切换执行状态（aarch32还是aarch64）只能通过切换EL或者重置来实现，而切换EL后切换的执行状态则由更高级的EL来决定。
| 要进入的EL | 决定这个EL执行状态的寄存器 |
|--|--|
| Non-secure EL1 | HCR_EL2.RW |
|Secure EL1|SCR_EL3 (当Secure EL2 启用的时候是 HCR_EL2 )|
|EL2|SCR_EL3.RW|
|EL3|重置 EL3时候设置的值|



比如：

> 处于aarch32状态的EL0的程序时候如果监测到接下来要执行的指令（比如一些系统调用什么的）是aarch64的，就会主动触发异常，根据这个异常会切换到高权限的EL1（系统运行的层面），并将接下来需要执行的aarch64指令通过AArch64状态执行，而这个El1层执行状态是AArch64是由谁决定的呢？是由E2层的SCR_EL3.RW寄存器决定的。


并还遵循以下原则：
>- 当异常发生时，有两种选择，停留在当前的EL，或者跳转到更高的EL，EL不能降级。同样，异常处理返回时，也有两种选择，停留在当前EL，或者调到更低的EL
>- 从低权限EL切换到高权限EL（抛出异常），执行状态可以保持不变或者切换到 AArch64。
>- 从高权限EL切换到低权限EL（从异常中返回使用汇编指令ERET ），执行状态可以保持不变或者切换到 AArch32。

因此在armv8虚拟化的时候，64-bit 层可以运行 32-bit层的应用, 但反过来不行。
举个例子一个 64-bit 系统内核既可以用来运行 64-bit 程序也可以运行 32-bit 程序,而一个 32-bit OS 内核 只能运行 32-bit 程序。


![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/78d9727764101ab7ece437c8231b7e66.png)
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/ca894b67a689162ee718827039d1e5c4.jpeg#pic_center)
参考：

 1. https://stackoverflow.com/questions/62950194/why-the-machine-code-of-the-arm32-instruction-cannot-be-found-in-arm64-instructi
 2. https://cloud.tencent.com/developer/article/1169931
 3. https://developer.arm.com/documentation/102412/0100/Execution-and-Security-states
 4. https://developer.arm.com/documentation/102412/0100/Handling-exceptions
 5. 指令集手册：https://documentation-service.arm.com/static/60119835773bb020e3de6fee

