---
title: pwntool卸载gdb安装pwndbg
date: 2019-08-26 13:39:31
tags:
---

众所周知pwndbg是gdb的一个增强版（可以直接打印栈等等），在pwntool里可以使用gdb.attach()来调用pwndbg,起到一边调试一边pwn的作用，但在没有安装pwndbg之前你已经安装了gdb的话，这个时候无法完成覆盖安装，就无法使用gdb.attach()来调用pwndbg，所以我们要卸载gdb，这个卸载方法有点麻烦（环境kali，应该也适用于ubuntu）

```bash
sudo apt-get remove --purge gdb
sudo rm -rf /usr/share/gdb
```
卸载完后安装pwndbg
```bash
git clone https://github.com/pwndbg/pwndbg
cd pwndbg
./setup.sh
```
之后就愉快的玩耍吧
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/b9436b332c9aa557c49f7d290fe695de.png)
