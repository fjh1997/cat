---
title: WSL2运行访问本机外网地址的配置
abbrlink: 28217
date: 2024-06-01 15:15:29
tags:
---

在.wslconfig里面配置
```bash
[wsl2]
autoMemoryReclaim=gradual
networkingMode = mirrored
dnsTunneling=true
firewall=true
autoProxy=true
[experimental]

hostAddressLoopback=true
```

