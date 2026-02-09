---
title: FTP卡在150 Opening ASCII mode data connection”的解决方法
abbrlink: 58558
date: 2024-11-19 20:40:11
tags:
---

防火墙都已经开了，但是依然有问题，发现是hyper-v动态端口占用了，设置下即可：

```powershell
netsh int ipv4 set dynamicport tcp 49152 16383 persistent
```

