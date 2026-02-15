---
title: windows的bat脚本连接字符串并保存到一个临时变量中
abbrlink: 9747
date: 2019-12-23 09:01:30
tags:
---

假设我有一个文件目录，里面有很多sql文件，我需要遍历这些sql文件并获取他们的文件名，将文件名字符串连接起来形成一个列表存储到一个临时变量中，那么应该怎么做呢？

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/345cae7c99602cef0e1f278aae2001e0.png)
可以参考下面的脚本
```batch
@echo off
setlocal enabledelayedexpansion
set myvar=the list: 
for /r %%i In (*.sql) DO set myvar=!myvar! %%i,
echo %myvar%
```
最终会输出一个连接起来的列表，需要注意的是windows临时变量存储最多只能保存8192bytes大小。
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/b3799b6095bd3d41fedb6692903e18a8.png)
## 连接两个Remarks变量
比如我要批量把*.sql命名为\*_old.sql那么应该怎么做呢？
其实@fname 和 @ext 这种Remarks变量可以直接连接的
```
forfiles /S /M *.sql /C "CMD /C REN @path @fname_old.@ext"

```
## Remarks


- **Forfiles** is most commonly used in batch files.
- **Forfiles** /s is similar to dir /s.
- You can use the following variables in the command string as specified by the /c command-line option.
Variable	Description
@FILE	File name.
@FNAME	File name without extension.
@EXT	File name extension.
@PATH	Full path of the file.
@RELPATH	Relative path of the file.
@ISDIR	Evaluates to TRUE if a file type is a directory. Otherwise, this variable evaluates to FALSE.
@FSIZE	File size, in bytes.
@FDATE	Last modified date stamp on the file.
@FTIME	Last modified time stamp on the file.


