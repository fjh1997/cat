---
title: linux转发外网的端口到监听在127.0.0.1的端口
abbrlink: 58897
date: 2021-06-28 19:49:49
tags:
---

启用127.0.0.1的路由功能。
```bash
sysctl -w net.ipv4.conf.eth0.route_localnet=1 
```
其中``eth0``改为自己的网卡名称，可用ifconfig查看。
在iptable里面配置：

```bash
 sudo iptables -t nat -A PREROUTING -p tcp --dport 2001 -j DNAT --to-destination 127.0.0.1
```
参考：https://unix.stackexchange.com/a/570253/337890
