---
title: 解决windows10下Visual Studio Code 终端无法输入输出的问题
date: 2019-11-27 09:20:02
tags:
---

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/9007f9b15073331c226d43bba0363654.png)
正常情况下，终端可以输入输出
但是我遇到的问题是
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/2c29a24949b99724f1e56821d9648810.png)
卡在这里，不能输入也不能输出
解决方法是把cygwin或者其他野路子的gdb和g++换成mingw64的

https://sourceforge.net/projects/mingw-w64/files/Toolchains%20targetting%20Win32/Personal%20Builds/mingw-builds/installer/mingw-w64-install.exe
