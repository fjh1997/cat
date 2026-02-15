---
title: Msfconsol socks4 隧道nmap无法扫描的原因
abbrlink: 21131
date: 2024-03-27 20:50:19
tags:
---

需要加上-Pn参数，因为proxychain4无法代理icmp，而nmap首先会使用ping命令的协议扫描存活主机，如果不存在就不继续扫描了。所以需要加上-Pn参数不用ping进行扫描，直接使用-sT扫描端口。

