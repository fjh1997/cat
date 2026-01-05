---
title: WSL2 run 32bit program WSL2运行32位程序
date: 2020-09-21 21:52:42
tags:
---

说在前面，这个真的不用QEMU = =
```bash
sudo dpkg --add-architecture i386
sudo apt-get update
sudo apt-get install libc6:i386 libncurses5:i386 libstdc++6:i386
```


