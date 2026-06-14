---
title: centos7配置 局域网自动解析hostname
abbrlink: 40930
url: /posts/40930.html
date: 2023-11-20 16:05:11
tags:
---

这样可以让局域网别的电脑直接通过hostname来连接这台电脑。
如果不是windows系统，可以用hostname.local来连接
主要是用到了mdns的功能，需要安装nss-mdns。
vmware下nat模式下，宿主机也可以通过连接hostname使用。
```bash
yum install epel-release #需要添加epel源
interface=`ls /sys/class/net | head -n1`
cat /etc/sysconfig/network | grep -v HOSTNAME= >/etc/sysconfig/network
echo 'HOSTNAME='$(hostname) >>/etc/sysconfig/network
# echo $(ip route get 1.2.3.4 | head -n 1|awk '{print $NF}') $(hostname)'.local' $(hostname) >>/etc/hosts
echo 'send host-name "'$(hostname)'";' > /etc/dhclient-$interface.conf
echo 'supersede domain-name "local";' >> /etc/dhclient-$interface.conf
echo 'supersede domain-search "local";' >> /etc/dhclient-$interface.conf
yum install nss-mdns -y
reboot
```

