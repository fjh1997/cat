---
title: qemu-kvm 实现和windows系统的文件夹共享和剪贴板共享
abbrlink: 19792
date: 2021-11-08 11:53:47
tags:
---

# 剪贴板共享
下载安装
https://www.spice-space.org/download/windows/spice-guest-tools/spice-guest-tools-latest.exe 
# 文件夹共享
在windows里下载安装
https://www.spice-space.org/download/windows/spice-webdavd/spice-webdavd-x86-latest.msi

virt-manager里面添加通道。
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/f3417f18174ee8875c75cff52ec94df7.png)
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/d0a396bc54e144289a5c712c9ac1d2d7.png)
windows上启动服务
之后使用linux自带的remote-viewer使用spice协议可以连接：

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/d0aa988c3b092da1ec29def6b1ec76b3.png)
![libgstapp](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/ee472c7b242675c7ab2a4424981c8b88.png)


连上去之后点“文件-preference“就能够实现文件共享
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/6ea464b80fc9411b650f6b4e89fd2ad5.png)



参考：https://dausruddin.com/how-to-enable-clipboard-and-folder-sharing-in-qemu-kvm-on-windows-guest/
