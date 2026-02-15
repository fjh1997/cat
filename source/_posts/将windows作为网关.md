---
title: 将windows作为网关
abbrlink: 6583
date: 2024-04-20 13:07:26
tags:
---

开启转发
```bash
reg add HKLM\SYSTEM\CurrentControlSet\Services\Tcpip\Parameters /v IPEnableRouter /D 1 /f

```
开启routing and remote access服务
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/a27cb5bebdbcd336e2d079e7dd0771cc.png)
这样局域网里面别的设备能通过windows进行上网
参考：https://www.cnblogs.com/chrishg/articles/12861053.html
