---
title: 解决64位栈溢出ret2lib时的 do_system  movaps xmmword ptr [rsp + 0x40], xmm0 crash的问题
date: 2020-04-25 19:44:26
tags:
---

 ```

Thread 2.1 "protect" received signal SIGSEGV, Segmentation fault.
0x00007f6f2b2942f6 in do_system (line=0x7f6f2b3f8e9a "/bin/sh") at ../sysdeps/posix/system.c:125
125	in ../sysdeps/posix/system.c
LEGEND: STACK | HEAP | CODE | DATA | RWX | RODATA
─────────────────────────────────[ REGISTERS ]──────────────────────────────────
 RAX  0x7f6f2b3f8e97 ◂— sub    eax, 0x622f0063 /* '-c' */
 RBX  0x0
 RCX  0x7f6f2b3f8e9f ◂— jae    0x7f6f2b3f8f09 /* 'sh' */
 RDX  0x0
 RDI  0x2
 RSI  0x7f6f2b6326a0 (intr) ◂— 0x0
 R8   0x7f6f2b632600 (quit) ◂— 0x0
 R9   0x0
 R10  0x8
 R11  0x246
 R12  0x7f6f2b3f8e9a ◂— 0x68732f6e69622f /* '/bin/sh' */
 R13  0x7ffe595d5ff0 ◂— 0x1
 R14  0x0
 R15  0x0
 RBP  0x7ffe595d5dd8 ◂— 0x0
 RSP  0x7ffe595d5d78 ◂— 0x0
 RIP  0x7f6f2b2942f6 (do_system+1094) ◂— movaps xmmword ptr [rsp + 0x40], xmm0
───────────────────────────────────[ DISASM ]───────────────────────────────────
 ► 0x7f6f2b2942f6 <do_system+1094>    movaps xmmword ptr [rsp + 0x40], xmm0
   0x7f6f2b2942fb <do_system+1099>    call   sigaction <0x7f6f2b284110>
 
   0x7f6f2b294300 <do_system+1104>    lea    rsi, [rip + 0x39e2f9] <0x7f6f2b632600>
   0x7f6f2b294307 <do_system+1111>    xor    edx, edx
   0x7f6f2b294309 <do_system+1113>    mov    edi, 3
   0x7f6f2b29430e <do_system+1118>    call   sigaction <0x7f6f2b284110>
 
   0x7f6f2b294313 <do_system+1123>    xor    edx, edx
   0x7f6f2b294315 <do_system+1125>    mov    rsi, rbp
   0x7f6f2b294318 <do_system+1128>    mov    edi, 2
   0x7f6f2b29431d <do_system+1133>    
```
主要的原因ex师傅的[帖子](https://www.xmcve.com/2019/05/%E5%9C%A8%E4%B8%80%E4%BA%9B64%E4%BD%8D%E7%9A%84glibc%E7%9A%84payload%E8%B0%83%E7%94%A8system%E5%87%BD%E6%95%B0%E5%A4%B1%E8%B4%A5%E9%97%AE%E9%A2%98/)
里有说，是  movaps xmmword ptr [rsp + 0x40], xmm0这条指令会检查栈是否对齐，我这里的栈指针RSP的值为0x7ffe595d5d78，要对齐的话结尾必须要是0，比如0x7ffe595d5d70这种。
解决的方法很多，但是Qfrost师傅想出了最轻松的方法就是在gadget前面加上一个ret，比如地址0x0400A44是ret指令，那么我们的payload里面就要从单纯的gadget变成p64(0x0400A44)+gadget。
