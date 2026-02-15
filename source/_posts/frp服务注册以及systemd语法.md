---
title: frp服务注册以及systemd语法
abbrlink: 28896
date: 2019-12-24 09:22:59
tags:
---

https://github.com/fatedier/frp/releases
从github上面下载了frp的release以后解压，里面有一个systemd的文件夹，这是干什么用的呢？
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/0586ab1c526d8c545a8ccf27607f7188.png)
打开之后，会发现文件夹里面有一些文件名为frps、或者是frps@，其实这些就是systemd注册的配置。
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/b0dd7649e53c3307467bbb43c44520c1.png)
点开查看如下

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/b1aec36403e0ed11b8dee1fdd47c0990.png)

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/383c585a42403a5ba0505f8e47e22397.png)可以看到frpc和frpc@文件里面只相差一个%i，我们可以从linux配置文件说明里找到这样做的理由。
>Units names can be parameterized by a single argument called the "instance name". The unit is then constructed based on a "template file" which serves as the definition of multiple services or other units. A template unit must have a single "@" at the end of the name (right before the type suffix). The name of the full unit is formed by inserting the instance name between "@" and the unit type suffix. In the unit file itself, the instance parameter may be referred to using "%i" and other specifiers, see below.

也就是说，带有@的.service文件相当于一个模版文件，能够根据启动时候加的参数不同，替换文件里面的%i位置的内容，从而可以根据不同的参数启动不同的服务，比如说这个frpc@.service文件，里面的%i标记是加在.ini前面的，那么启动服务的时候就可以通过参数的形式传入不同的配置文件从而启动不同配置的frpc服务。
我们把下载好的所有\*.ini文件放到/etc/frpc/目录下，同时在相同目录里面新建一个文件名为test.ini，把所有\*.service文件放到/etc/systemd/system/目录下
然后输入命令
```bash
systemctl enable frpc@test#这步用来注册服务
systemctl start frpc@test#这步用来启动服务
```
那么系统就会注册一个名为frpc@test的服务，但是显然这个服务是你用模版灵活启动的。
服务注册相关资料：
[系统注册systemd.unit](https://www.freedesktop.org/software/systemd/man/systemd.unit.html#)
