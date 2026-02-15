---
title: 如何做到一边使用pwntools一边使用gdb下断点到main函数前
abbrlink: 27611
date: 2020-04-10 15:44:55
tags:
---

在回答这个问题的时候，我相信绝大多数师傅调试都是按照下面这个格式：

```python
from pwn import *
payload=b'aaaaaa'
sh=process("./pwn")
gdb.attach(sh,"break main")
sh.sendline(payload)
```
但是很遗憾，这样调试有一个缺点，那就是gdb在attach到程序之后，你要调试的断点可能已经早就过去了，来不及下断点，这就会导致gdbscript执行失败。
但是最近我发现了一种新的方法，可以使用gdb直接启动这个程序，这样就能够即时给程序加上断点，甚至第一条指令也能下断点。
```python
from pwn import *
payload=b'aaaaaa'
sh=gdb.debug("pwn","break main")
sh.sendline(payload)
```
安装pwnlib的[官方文档](https://docs.pwntools.com/en/stable/gdb.html)，使用这个debug函数不光可以在第一个指令那里下断点，同时，返回程序的管道，之后我把它赋值在sh变量中，之后调试和别的也差不多。
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/ab621ce2c07df981f21ed2fb3b3de2ba.png)
