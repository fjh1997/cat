---
title: 使用openvpn作为网关上网故障排除
abbrlink: 34191
date: 2021-09-12 17:23:01
tags:
---

参考：https://serverfault.com/questions/648118/openvpn-not-default-gateway-for-all-traffic

1.确保/etc/sysctl.conf里面设置了net.ipv4.ip_forward = 1
2.确保NAT网关生效：

```bash
iptables -t nat -I POSTROUTING -s 10.8.0.0/24 -o eth0 -j MASQUERADE
```
我配置了上述设置发现还是不通，于是查看了一下syslog

```bash
cat /var/log/syslog|grep -F  "10.8.0"
```
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/be9b1834d8efe3c8165ccc22832c0d77.png)
可以发现ufw阻止了一些连接，重新设置规则即可。
