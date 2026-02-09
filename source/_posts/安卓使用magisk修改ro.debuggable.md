---
title: 安卓使用magisk修改ro.debuggable
abbrlink: 39185
date: 2024-01-28 15:22:44
tags:
---

```bash
adb shell #adb进入命令行模式

su #切换至超级用户

magisk resetprop ro.debuggable 1

stop;start; #一定要通过该方式重启
```
来源：https://www.cnblogs.com/xiaoweigege/p/15726711.html
