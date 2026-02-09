---
title: 解决安卓linux dploy下非root用户的进程在锁屏几分钟之后断网的问题--禁用doze mode。
abbrlink: 21344
date: 2020-12-15 13:57:33
tags:
---

使用linux deploy的chroot方案安装了debian之后出现这个问题的原因主要是安卓的doze mode，在termux下键入`su`  进入类似adb shell的模式，然后使用`dumpsys deviceidle disable`禁用这个锁屏之后的睡眠模式。
