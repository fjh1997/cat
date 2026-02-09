---
title: 使用dism++重置无法启动的Windows
abbrlink: 28623
date: 2023-12-26 22:29:41
tags:
---

最近使用傲梅分区助手给c盘扩容，结果造成了系统无法启动，提示蓝屏，错误代码为CONFIG_INITIALIZATION_FAILED
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/d8d53f98500c94ae6bb9234f09ed69a7.jpeg)
感觉后悔莫及，其实用Windows自带的磁盘管理工具完全也可以给c盘扩容。
本来想使用wondows的重置系统功能恢复出厂设置，这样可以保留我的文件的情况下重装系统。但奈何进不了系统的情况下没法使用这个功能。
试了下微软官方的creation tool里面的修复系统功能也不行，感觉很鸡肋。
之后发现使用dism++可以直接恢复系统映像，这样就不用将c盘所有数据拷贝出来然后格式化重装了，不然费时费力。
首先下载Windows系统的iso镜像拷贝到微pe系统里面然后启动pe系统后在pe系统里面打开挂载，找到这个install.wim文件。
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/f53d430d2cf0da3cc4e9029c791758b1.png)
之后使用dism++恢复映像即可,注意不要勾选格式化，旧的文件会保留在windows.old.001文件夹里面。
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/68eb6c6c11279e1f1d0995b3f3a5a7a7.png)
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/5fda8de5cb28cfc411b1248f21ce6505.png)
