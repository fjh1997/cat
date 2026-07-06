---
title: abrt-hook-ccpp占用cpu过大，使用systemctl进行关闭
abbrlink: 28507
url: /posts/28507.html
date: 2020-04-21 22:00:31
tags:
---

使用 systemctl list-unit-files |grep abrt列出abrt相关服务模块统一进行关闭并禁用。
![在这里插入图片描述](/images/e5e5274b4e63abda2ea4b449170cd1c5.png)
同时修改/proc/sys/kernel/core_pattern的内容为core
