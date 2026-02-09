---
title: 多网段情况下配置windows防火墙允许ping以及远程打印和网络发现
abbrlink: 46332
date: 2019-06-24 08:08:14
tags:
---


1 左下角搜索栏中输入“高级安全 Windows Defender 防火墙”
2.分别在“入站规则”和“出站规则”里面选择“文件和打印机共享（回显请求-ICMPv4-in）”，和“文件和打印机共享（回显请求-ICMPv4-out）”右键属性，在作用于-远程IP地址里选择任何IP地址![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/99c6c9231677b3f85ec71fcdad38bec1.png)

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/86371809ba3b396b132c1a9fdf0be5fc.png)
3.使用类似的方法，把类似网络发现和文件打印机共享之类的服务都启用远程地址，即可实现多网段情况下windows远程打印和网络发现。
