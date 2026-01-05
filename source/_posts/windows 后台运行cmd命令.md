---
title: windows 后台运行cmd命令
date: 2022-02-04 21:39:47
tags:
---

```c
#include <windows.h>
int main()
{
WinExec("\"C:\\Program Files\\WindowsApps\\PythonSoftwareFoundation.Python.3.8_3.8.2800.0_x64__qbz5n2kfra8p0\\pythonw3.8.exe\" D:\\KeymouseGo-3.2.2\\KeymouseGo.py D:\\KeymouseGo-3.2.2\\scripts\\red.txt",SW_HIDE);
return 0;
}

```
然后使用

```c
gcc -mwindows  a.c -o a.exe
```
编译。

这个命令会使gcc创建窗口应用程序而不是控制台应用程序，这样可以实现隐藏控制台。
