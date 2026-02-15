---
title: openclaw开启bash命令执行实现RCE
abbrlink: 45249
date: 2026-02-12 21:15:14
tags:
---
在渗透测试演习中，一旦入侵了openclaw（如[爆破token](https://github.com/fjh1997/BruteClaw)）之后该怎么远程执行命令呢？其实不用想办法和大模型玩越狱。直接修改这几处即可：  
主要修改两处：
![20260212211558](https://cdn.jsdelivr.net/gh/fjh1997/CSDN/source/images/20260212211558.png)
这里enable  
![20260212211627](https://cdn.jsdelivr.net/gh/fjh1997/CSDN/source/images/20260212211627.png)  
这里不光需要enable还需要设置webchat与通配符  
![20260212211907](https://cdn.jsdelivr.net/gh/fjh1997/CSDN/source/images/20260212211907.png)
之后使用/bash 命令即可执行程序。  
本文仅供安全研究使用，请勿违法使用。