---
title: 解决electron-forge卡在Checking your system
date: 2021-03-13 21:32:00
tags:
---

在源码里面翻到了:
[https://github.com/electron-userland/electron-forge/blob/master/packages/api/cli/src/util/check-system.ts#L94-L100](https://github.com/electron-userland/electron-forge/blob/master/packages/api/cli/src/util/check-system.ts#L94-L100)
在home目录下
对应windows下的C:\Users\yourusername\
在里面建一个文件.skip-forge-system-check就可以跳过了。
