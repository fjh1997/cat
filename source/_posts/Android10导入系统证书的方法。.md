---
title: Android10导入系统证书的方法。
date: 2020-06-15 09:10:02
tags:
---

由于安卓10采用了某些安全策略，将系统分区/system挂载为只读，就算你root了也没用，无法写入系统分区也就无法导入系统证书，在使用http-canary这样的软件抓包分析的时候，很多app只认系统证书，不认用户证书。唯一的方法是魔改安卓10的rom，或者使用magisk的一些模块，这里介绍的模块是magisk的Move Certificates模块。
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/d55736a53b9de12be62313baee42f6b0.png)
安装完模块之后，用户分区的所有证书默认会导入到系统分区。
~~有人私信我问我在哪，这个不是magisk repo里就有么，你们去下载就行了。~~ 

在这里下载：https://github.com/Magisk-Modules-Repo/movecert
下载成zip之后直接用这个FoxMagiskModuleManager（https://github.com/Fox2Code/FoxMagiskModuleManager）安装即可。

如果是miui12.5需要打开re管理器/mt管理器，找到

/data/data/com.guoshi.httpcanary/cache/HttpCanary.pem
复制到用户目录如/storage/emulated/0/Download之后，去设置里搜索ca证书选择目录里的文件手动安装。
也可以参考这两个方法：
https://www.bilibili.com/read/cv9278635
https://zhuanlan.zhihu.com/p/363266700
/data/data/com.guoshi.httpcanary/cache/HttpCanary.pem
复制一份并改名为HttpCanary.jks放到/data/data/com.guoshi.httpcanary/cache目录下退出重新进入小黄鸟，便会显示已经安装证书，然后导出证书为pem格式，再去设置里安装。

