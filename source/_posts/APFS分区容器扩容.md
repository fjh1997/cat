---
title: APFS分区容器扩容
date: 2021-04-30 08:12:28
tags:
---

首先使用以下命令列出当前需要扩容的apfs所在磁盘。
```bash
sudo diskutil list
```
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/3a9f4bd19dc0ec5522b2102f1ae4bb6f.png#pic_center)

比如disk0上面有个apfs分区然后使用以下命令扩容
```bash
sudo diskutil apfs resizeContainer disk0 0
```
这里的0代表分配给这个apfs容器磁盘剩下的全部未分配空间。
但需要注意的是apfs只能向后扩容，如果想利用apfs分区前面的未分配空间，必须使用比如傲梅分区助手的"扇区到扇区克隆"。把apfs分区往前挪。

参考：

 1. https://stackoverflow.com/questions/47704458/how-do-you-increase-the-size-of-an-apfs-volume
    
 2. https://apple.stackexchange.com/questions/347396/how-do-i-increase-an-apfs-partition-size

