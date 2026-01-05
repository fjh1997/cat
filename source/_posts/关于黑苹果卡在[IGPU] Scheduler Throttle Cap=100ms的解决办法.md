---
title: 关于黑苹果卡在[IGPU] Scheduler Throttle Cap=100ms的解决办法
date: 2019-12-25 23:20:50
tags:
---

之前用的opencore来配置黑苹果结果卡在这个地方死活进不去
[IGPU] Scheduler Throttle Cap=100ms
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/4cf7a1e46b3b12ebd82f4b5fb05db92e.png)
之后去bios里面把igpu关掉就行了。
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/00eae0141ba788e3ffd05b6668053daf.png)
选择高级
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/b587cb028c2b3ce53771985f8d74362b.png)
选择北桥
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/0a127374a31100ebb11a50dcd0858956.png)
选择显示设置
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/9c5420e7545335278c4307cde915510d.png)
把初始化IGPU关了。
我现在ASUS B360M的主板，蓝宝石白金vega56，i7-8700的cpu，realtek rtl8168/8111 的网卡，使用openvz引导。
分享我的EFI配置：https://github.com/fjh1997/opencore-config-share
