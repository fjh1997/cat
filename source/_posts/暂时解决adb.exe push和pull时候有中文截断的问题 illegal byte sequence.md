---
title: 暂时解决adb.exe push和pull时候有中文截断的问题 illegal byte sequence
date: 2023-03-21 19:06:40
tags:
---


主要原因是mingw工具链里/mingw-w64-crt/misc/dirname.c和/mingw-w64-crt/misc/dirname.c里面的`setlocale (LC_CTYPE,"");`这一句，删掉这一句其实就可以了。dirname()函数在 "C "locale不会出现截断bug。
`setlocale(LC_CTYPE, "")`意思是把设置为[GetACP()](https://learn.microsoft.com/en-us/windows/win32/api/winnls/nf-winnls-getacp)的返回值;也就是系统默认编码。在我的电脑上是GBK
`setlocale(LC_CTYPE, 0)`等同于`setlocale(LC_CTYPE, NULL)`，不实际修改locale。但是后者返回程序当前的编码也就是"C"

而setlocale(LC_CTYPE, "")将locale改为系统默认，如果系统默认的locale和传入dirname()函数的locale的编码不一致就会导致截断。
不知道该修ADB那边还是修MINGW那边，可以暂时先用这个版本的ADB：
https://github.com/fjh1997/adb-for-windows-nonascii
主要处理的是wcstombs里面参数不正确的截断问题。
这个代码还有一个BUG，由于windows存储文件名，API调用文件名用的都是宽字节字符串，也就是UTF-16BE编码，而dirname.c在处理多字节字符串的时候根据当前系统locale即ACP，（一般中文是GBK，DBCS之一）来解码多字节字符串为UTF-16BE，adb传给dirname.c的文件名是标准UTF-8的编码，和GBK不同，自然就出错了。
下载：
https://download.csdn.net/download/fjh1997/87603245
