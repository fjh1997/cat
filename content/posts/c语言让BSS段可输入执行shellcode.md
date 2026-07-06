---
title: c语言让BSS段可输入执行shellcode
abbrlink: 43991
url: /posts/43991.html
date: 2023-10-23 16:39:29
tags:
---

```c
#include <stdio.h> 
#include <string.h> 
#include <unistd.h>
#include <sys/mman.h>

char shellcode[800];

void vulnerable() { 

mprotect(0x404000,0x1000,PROT_READ | PROT_WRITE|PROT_EXEC); //第一个参数需要是内存段的起始地址，第二个参数需要对其，64位是0x1000
gets(shellcode);
puts(shellcode);

((void(*)(void))&shellcode)();

return;
} 
int main(int argc, char **argv) {
 vulnerable();
 return 0; 
 }
```

