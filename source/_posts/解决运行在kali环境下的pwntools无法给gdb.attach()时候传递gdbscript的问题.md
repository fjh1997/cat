---
title: 解决运行在kali环境下的pwntools无法给gdb.attach()时候传递gdbscript的问题
date: 2020-03-11 23:08:07
tags:
---

最近在做pwn题，写了如下脚本：

```python

##!/usr/bin/env python
from pwn import*
 
r=process('./ret2libc2')
 
sys_adr=0x08048490
gets_adr=0x08048460
buf2_adr=0x0804A080
gdb.attach(r,'''
b * 080486BA 
''')#这里下个断点
 
payload=b'A'*112+gets_adr+sys_adr+buf2_adr+buf2_adr
 
r.sendline(payload)
r.sendline('/bin/sh')
r.interactive()           
```
本来是很简单的一个题，但我今天调试的时候发现了一个问题

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/2fb8aa54bfbefef41881852af51c7e61.png)
提示在倒入gdbscript文件的时候提示，No such file or directory，但是我去目录下看了看，确实是有这个文件的。
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/820eb397b522d97d8d79bbec280163a3.png)

显然这是一个bug我又在ubuntu里面跑了同一个脚本仔细查了一下。发现没有这个问题。
为了解决这个bug，我去翻pwntools的源码，因为gdb相关的命令是在pwnlib里面的，我就用了如下命令查看：

```python
>>>import pwnlib
>>>pwnlib.__file__
'/home/kali/lib/python3.7/site-packages/pwnlib/__init__.py'
>>>
```
在pwnlib的目录下翻了翻，因为和gdb有关就
之后浏览/home/kali/.local/lib/python3.7/site-packages/pwnlib/gdb.py看到了一些东西，
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/5f341c91ef254b52359a02a52af6a362.png)

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/65fc7601293ca56f335d8aa0e6c9285b.png)
可以看到，gdb.attach()的原理主要是通过在新终端中启动命令。命令的组成中 -x的参数对应的是gdbscript文件也就是"b * 080486BA"这一个下断点的命令。
之后我又去翻了翻misc的库，它在pwnlib.util里面
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/9ac0ed0248aa2f58fe00ad9cb5240b7d.png)
显然pwntools-terminal是没有的，我没装，那么打开的就是后面一些东西。检查了一下发现DISPLAY在os的环境变量里面，优先级比较高，然后我就去查了一下x-terminal-emulator
发现以下命令会产生相同的问题：

```bash
/usr/bin/x-terminal-emulator -e '/usr/bin/gdb -q  "./ret2libc2"  -x "/tmp/gdbscript"'
```
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/7f0d9c246793699e317e7927f1644c90.png)
之后我在Ubuntu里面执行相同的命令，虽然也报错，但不太一样。
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/bf5fa9b4a58986e5d583b05317aec646.png)
区别就在于一个有双引号，一个没有。
然后我在两个系统里面分别 cat /usr/bin/x-terminal-emulator得到了不同的结果
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/fb731ff5f7f639774e9de6266e7b6622.png)
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/6d6e2ed637f8b7854c4baa63836c5e1d.png)

在kali里面是二进制文件，但在ubuntu里面是脚本文件，而且最后启动的还是gnome-terminal，于是我的思路就来了，原来x-terminal-emulator只是一个引用而已，并不是一个实际的伪终端程序。
网上查了查，发现x-terminal-emulator可以被配置：

```bash
sudo update-alternatives --config x-terminal-emulator
```
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/b7dd13e016d836a407bee08d85c43599.png)
可以看到，在kali里面默认的引用是qterminal，其他的还有xterm等，于是我使用qterminal使用该命令

```bash
qterminal -e '/usr/bin/gdb -q  "./ret2libc2"  -x "/tmp/gdbscript"'
```
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/8a99934438236b870a507fa2f68ad46c.png)
可以看到这个命令被转义了，转义成了以下命令：

```bash
qterminal -e /usr/bin/gdb -q  \"./ret2libc2\"  -x \"/tmp/gdbscript\"
```
这就导致gdb在接收这个文件路径的时候/tmp/gdbscript结果接收了\"/tmp/gdbscript\"，
导致路径出错，gdb的路径不能有双引号。
之后我一连试了koi8rxterm,lxterm,uxterm ,xterm发现都没问题只有qterminal有问题，于是就交了一个issue [https://github.com/lxqt/qterminal/issues/665](https://github.com/lxqt/qterminal/issues/665)
所以解决方法就是换x-terminal-emulator的引用程序，不过qterminal很漂亮，别的虽然不出错，但都很丑。
忙了半天，这个bug就算解决了吧，以后还是用ubuntu比较好。
