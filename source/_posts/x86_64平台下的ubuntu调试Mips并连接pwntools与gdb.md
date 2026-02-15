---
title: x86_64平台下的ubuntu调试Mips并连接pwntools与gdb
abbrlink: 45563
date: 2020-05-06 20:10:16
tags:
---


首先安装qemu
```bash
sudo apt update
sudo apt install qemu-user libc6-mipsel-cross qemu-user-binfmt gdb-multiarch
sudo mkdir /etc/qemu-binfmt
sudo ln -s /usr/mipsel-linux-gnu /etc/qemu-binfmt/mipsel

```

检查路径是否正确

```python
>>> from pwn import *
>>> pwnlib.qemu.user_path(arch='mips')
'qemu-mipsel'
>>> pwnlib.qemu.ld_prefix(arch='mips')
'/etc/qemu-binfmt/mipsel'
```



之后使用pwntools
## 方法一：

```python
from pwn import *
context.arch='mips'
sh=gdb.debug('./pwn')
payload='xxxxx'
sh.sendline(payload)
```
## 方法二：
```python
#!/usr/bin/env python
#-*- coding:utf-8 -*
#import pwnlib
from pwn  import *

payload=b'\xca\xb2\xf0\x88\x0f&Z\xd3\x08L\xe1\x08qI\xa4\x16\x04\xd7<ar\x18 R\xe7\x00q\xd0\x84u\x1e\xad\xec\x1a\x08\xfe\xf8\xad\xe7\xab\x08\xabl9%\xb2e\xc4\xa4\xbc\x07r1_1_}R9D\xb7\x06\x05\xb4'
s=process(["qemu-mipsel","-g", "1234","-L","/usr/mipsel-linux-gnu/","./3348084723"])
pwnlib.qemu.user_path(arch='mips')
pwnlib.qemu.ld_prefix(arch='mips')
context.arch='mips'
context.log_level = 'debug'  
#gdb.attach(s,'''b memset''')
#raw_input()
s.recvuntil("Faster >")
s.sendline(payload)
s.interactive()


```
将以上脚本命名为python脚本运行：
会卡在这里等待gdb连接
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/906f6c6eb2cbae86ae139a6345c461a1.png)

这个时候另起终端输入以下命令
```bash

gdb-multiarch -nx ./3348084723 #注意要加nx，如果你安装了pwndbg然后不加直接运行的话可能在步进的时候会出错。
#然后进入gdb里面输入
set arch mips
set endian little
set sysroot /usr/mipsel-linux-gnu
target remote localhost:1234
b *0x004021d0
```
连接成功之后就可以进行调试，需要注意的是使用这个方法调试的时候在程序read的时候在pwntool的interactive()里使用ctrl+c中断不太行，因为pwntool使用的是管道，不支持远程传输SIGINT信号。如果在gdb里面使用ctrl+c也不行，因为qemu貌似也不太支持远程接收该ctrl+c信号，这就需要我们提前设好断点。或者使用以下命令强行发送SIGNINT信号：
```bash
kill -INT 9786 #这里9786是qemu-linux-user的pid
```
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/705d938783539d6330e8f784b827d571.png)
风格是原版风格，假如有师傅知道怎么兼容pwndbg，欢迎告知。




