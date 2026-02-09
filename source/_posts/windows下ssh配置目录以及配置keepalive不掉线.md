---
title: windows下ssh配置目录以及配置keepalive不掉线
abbrlink: 54584
date: 2020-07-02 19:01:20
tags:
---

如果是openssh的话配置目录在：
C:\Users\用户名\\.ssh
在里面新建文件，名为config
里面输入
```bash
Host *
    ServerAliveInterval 40
```
