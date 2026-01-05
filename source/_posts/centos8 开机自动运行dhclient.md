---
title: centos8 开机自动运行dhclient
date: 2021-09-04 19:24:55
tags:
---

问题：每次开机都不会自动分配ip地址，需要使用`dhclient`自动分配：

网上查到（https://superuser.com/questions/578293/linux-centos-how-to-permanent-inititate-dhcp-client-any-reboot）是要在
/etc/sysconfig/network-scripts/ifcfg-ethX里面设置自动分配，然而设置了之后没有用，之后继续查。

https://forums.centos.org/viewtopic.php?f=56&t=76322
这里面则提到使用以下命令检查networkmanager的功能。

```bash
sudo nmcli con up ens3

```
我运行了下，结果报错。
> Error: Connection activation failed: No suitable device found for this connection (device lo not available because device is strictly unmanaged).

之后在https://www.codenong.com/cs106977483/这篇文章里面找到办法：

```bash
查看托管状态
nmcli n
显示 disabled 则为本文遇到的问题，如果是 enabled 则可以不用往下看了
开启 托管
nmcli n on
```
使用nmcli启用托管即可。
