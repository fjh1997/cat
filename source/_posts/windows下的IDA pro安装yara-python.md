---
title: windows下的IDA pro安装yara-python
abbrlink: 37225
date: 2020-07-06 20:55:51
tags:
---

遇到了一堆报错。

> fatal error C1083: Cannot open include file: 'stdbool.h': No such file or directory
> yara/libyara/include\yara/stream.h(35) : error C2054: expected '(' to follow '_Bool'


由于最新的yara4.x不再支持python2了。所以我们在windows下使用pip安装yara的时候实际上不是用wheel来安装，而是源码编译来安装，而源码编译经常会报错。
要去pypi的源里面去找轮子装，结果发现只有3.11的轮子支持python2的而且是windows的版本：
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/9504ab0069b3afec753e03f9904f0831.png)
现在就找到解决方法了，就是限定版本：
在idapython里使用以下命令指定版本安装，可以找到wheel文件。
```bash
.\python.exe -m pip install yara-python==3.11.0
```



