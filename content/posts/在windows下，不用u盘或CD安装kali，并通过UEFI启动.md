---
title: 在windows下，不用u盘或CD安装kali，并通过UEFI启动
abbrlink: 33929
url: /posts/33929.html
date: 2019-05-22 11:16:15
tags:
---

很简单，你可以将ISO提取到你的一个硬盘分区（确保格式化为FAT32），例如sda7，然后使用easyuefi为这个分区设置一个uefi启动项，当你从这个分区启动时，选择图形安装，它会要求你从CD安装，然后你可以通过“alt + ctrl + F2”进入命令行模式。然后键入`blkid`列出分区（通过这个命令可以检查分区的大小和类型，比如你发现sda7是正确的分区）并通过命令 `mount /dev/sda7 /cdrom`将此分区挂载为CD。之后按“alt + ctrl + F5”，转到图形模式并继续。如果仍有一些错误，请使用“alt + ctrl + F4”键来打开日志输出，并检查错误，例如错误是“/dists/kali-rolling not found”，然后你可以创建一个目录`mkdir dists/ kali-rolling`，之后 `cp -r dists/kali-last-snapshot/* /dists/kali-rolling/`.切换到图形模式然后继续，之后应该就能成功。

 -参考 https://superuser.com/questions/962926/cant-install-kali-linux-from-usb-fails-to-find-cd-rom-drive

