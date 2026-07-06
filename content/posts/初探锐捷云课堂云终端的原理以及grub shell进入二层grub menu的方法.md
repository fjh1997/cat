---
title: 初探锐捷云课堂云终端的原理以及grub shell进入二层grub menu的方法
abbrlink: 46305
url: /posts/46305.html
date: 2024-04-16 09:23:30
tags:
---

学校用锐捷云机房，里面每台电脑是一个胖客户机，原理是跑了个ubuntu然后里面跑个KVM启动各种系统。但这样会有一定性能损失，尝试直接在宿主机里面跑程序。
那么在不破坏原系统的情况下，如何进入宿主机操作系统呢？
查了下系统是锐捷的rainOS
![在这里插入图片描述](/images/b0f803d5af7a47193d6c8332edf71f02.jpeg)

根据官网手册：
https://www.ruijie.com.cn/fw/wd/92323/
https://www.ruijie.com.cn/fw/wd/82313/

开机按F12可以选择启动项进入rainOS的recover模式![在这里插入图片描述](/images/9ae0c40c8ab71b8b171728b3f9ed0f07.jpeg)



（~~如果玩坏了提示硬盘错误，插U盘装这个https://www.ruijie.com.cn/fw/rj/265496/# 装完后设置ip一步到位~~ ）

![在这里插入图片描述](/images/d9d523b1a75bd46c404878892f23edfe.jpeg)
按E编辑
![在这里插入图片描述](/images/9936325569bddb78fd59bc09ed890043.jpeg)
根据grub的官方手册发现逻辑search -f /EFI/RasinOS/ruijie_rain300_boot  --set root是搜索出第一个包含/EFI/RasinOS/ruijie_rain300_boot的磁盘分区赋值给root变量，然后prefix变量再引用root变量，而prefix代表的是grub的根目录。![在这里插入图片描述](/images/137d6caa3ba34cfd7b3011cea489de31.jpeg)按c进入grub shell，之后可以使用ls命令查看有哪些磁盘分区，使用`ls+磁盘分区/`如`ls (hd0,gpt4)/`可以列出这个分区下面的文件，通过这种方式可以找到(hd0,gpt4)里面有这个文件。之后使用configfile命令执行这个目录下的/grub.cfg文件，但是一执行就直接进系统了，卡不到那个cfg文件的menu那里。
尝试这种方法在grub shell里面先设置timeout变量然后启动configfile，无效：
![在这里插入图片描述](/images/da6f7ccf726151591bebe8cf92f96ba7.jpeg)
之后看到grub的官方手册上的source命令，用source命令载入grub.cfg然后会进入新的grub shell之后手动set timeout=-1，之后使用normal命令回到menu就可以进入下一层了。
![在这里插入图片描述](/images/e9dc5b273edb503847addd1bd146ebb7.jpeg)
之后按e可以设置init=/bin/bash启动，默认的init是软连接指向systemd的/sbin/init![在这里插入图片描述](/images/49b8352fc2d8b9e05fd01bde675ab615.jpeg)
至于如何再不开启云终端系统的情况下启用systemd，由于云终端管理系统里面tty啥都禁了，shell也没有。问了清华大学学生网络与开源软件协会的Wang Miao学长,给了一个神操作在 init=bash 之后，在另一个 tty 上开一个 shell。
比如 setsid -c bash </dev/tty5 >/dev/tty5 2>&1
然后 systemctl --runtime mask getty@tty5
然后 exec /sbin/init 进系统
这样 tty5 上就会有个 shell 给你用.因为 mask 是操作文件,不经过 dbus所以systemctl也能用，之前systemctl因为连接不上systemd的dbus都失败了。

结果遇到tty不显示的原因，首先使用init=/bin/bash可以正常显示tty，然后使用exec init将1号进程init=/bin/bash替换为init=/bin/systemd之后对比两种情况的dmesg日志，结果发现在systemd后者的情况下日志里多了几条古怪的，还涉及到console：
![在这里插入图片描述](/images/68fa5f2a5f238578bb3dbc14bc256fcc.png)
使用grep命令查询发现：
![在这里插入图片描述](/images/a32c3715221ced75941dce7d029d0470.png)
在udev里面有个规则启动这个脚本。
![在这里插入图片描述](/images/1b0678da59b2088eea90153d31cffec1.png)
简单分析了这个脚本发现是手动给你清屏。
之后mask掉udev服务重启电脑会发现tty正常.

```bash
systemctl mask systemd-udevd
```

