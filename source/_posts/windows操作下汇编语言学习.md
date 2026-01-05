---
title: windows操作下汇编语言学习
date: 2023-12-18 16:02:59
tags:
---

安装msys2

```bash
pacman -S nasm
```

```bash
; ----------------------------------------------------------------------------------------
; 仅使用系统调用来输出 "Hello, World" 到控制台。 这个程序仅windows 64 下运行。
; 如何编译执行:
;
;     nasm -fwin64 hello.s && gcc hello.obj  && ./a.exe
; ----------------------------------------------------------------------------------------
        global  main
	extern puts
        section .text
main:
        sub rsp, 20h
        mov rcx, message
        call puts
        add rsp, 20h
message:
        db      "Hello, World", 0      
```
windows下汇编比较复杂，但是为了方便学习，使用nasm进行编译，操作，为了适应intel语法，使用gcc链接，为了能够使用puts这样的函数，比winapi（WriteConsoleA）要简单很多。
