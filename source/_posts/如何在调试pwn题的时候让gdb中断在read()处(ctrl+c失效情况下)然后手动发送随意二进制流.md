---
title: 如何在调试pwn题的时候让gdb中断在read()处(ctrl+c失效情况下)然后手动发送随意二进制流
abbrlink: 42321
date: 2021-02-13 20:32:47
tags:
---

平时使用gdb调试二进制程序的时候，可能会使用ctrl+c发送SIGINT来强迫程序中断好让gdb自动断点在read附近以方便我们在忘记加断点的时候调试，即使是qemu运行的程序也会把ctrl+c的SIGINT传递给内部模拟环境中的程序。
但是在使用pwntool调试程序的时候，由于pwntool和程序的交互用的是管道tube，所以我们无法发送SIGINT信号。
~~如果是非qemu启动的程序，我们可以使用gdb传输SIGINT信号，即在gdb里面按ctrl+C,很遗憾，当阻塞在系统调用的时候，gdb会把SIGINT发给系统进程，导致无法响应。~~ 
这个时候我推荐大家一种方法，那就是在程序阻塞在read()处的时候另起终端。手动发送SIGINT信号。
```bash
kill -INT pid
```
这个时候也能让gdb断在read()附近。
既然已经让gdb断在read附近了，我们可不可以发明一种方法，能够让我们边随意发送二进制数据边调试呢？其实也是可以的，那就是我们在python的`sh.interactive()`后面加上
```python
#需要import code
code.interact(local=locals())
```
这个时候针对以下脚本：

```python
from pwn import *
import code
import time
import os
context.arch = 'aarch64'
context.log_level = 'debug'
a=os.popen('fuser -k 1234/tcp')
print(a.read())
sh = process(["qemu-aarch64","-g","1234", "-cpu", "max", "-L", ".", "./chall"])
pwnlib.util.misc.run_in_new_terminal('gdb-multiarch   -ex \'set arch aarch64\' -ex \'set sysroot .\' -ex \'set endian little\' -ex \'target remote localhost:1234\' -ex \'b *0x0400c08\'  ./chall')
sh.interactive()
code.interact(local=locals())

```

就能达到这种效果：
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/8e1b310f4332dc0b588650f0f0d8b1d7.png#pic_center)
程序启动，gdb刚连上的时候就断在这个初始的位置，在左侧调试窗口输入c继续：
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/99546800c4b4e6cb9292391a34ca6618.png)

此时在右侧调试窗口，要求输入名字，左侧则是gdb放任程序执行，而程序会阻塞在read()处，我们这个时候可以另启动终端，根据红圈标注的pid发送SIGINT信号：
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/59497830b9a119f0c0442b519ec6f623.png#pic_center)
```bash
kill -INT 130
```
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/2febfc994cbe69cb5d8f0f21f3908fb6.png#pic_center)
发送完成后我们可以看到之前的左侧窗口中的pwndbg断在了read系统调用(0x4009012ac)的后一条指令(0x4009012b0)，此时程序的read系统调用收到的SIGINT信号。
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/1b08dbcbb47b265f73ef40c4c74d1958.png#pic_center)
此时我们再在pwndbg中continue继续，可以看到当前read不再阻塞（因为接收到了SIGINT信号）而是继续执行直到阻塞在下一个read系统调用(0x4009012ac)的位置：
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/29d6c0c1d08f7f5a2715ebf03bc683dd.png#pic_center)
由此我们就确定了系统调用read的位置，我们可以设置断点0x40009012ac这样在下一次阻塞的时候，我们可以逐步分析read读入buffer的字节。
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/17ef3e3b14e43d759d9bf5c3adabb26b.png#pic_center)
如图我们此时在左侧窗口键入ctrl+c，由于之前设置了`code.interact(local=locals())
`可以进入python的解释器模式:

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/b06972053278f3c86480a118d34de6c6.png#pic_center)
当然这个解释器功能没有添加readline这个库导致不能用方向键什么的，所以我们也可以用pdb代替：
```python
import pdb
pdb.set_trace()
```
我们可以在python的解释器模式里面发送二进制数据。发送完后使用`sh.interactive()`重新回到pwntool里面的交互模式：
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/d09267af3ad58d5ac507271dbee0b870.png#pic_center)
这样就做到了随时暂停程序发送二进制流，但是缺点是read的断点依然要提前设置才能够及时在调用read系统调用的时候发送二进制数据。

