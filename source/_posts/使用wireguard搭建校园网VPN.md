---
title: 使用wireguard搭建校园网VPN
date: 2025-12-31 14:52:23
tags:
---

<br>目前遇到两种场景：
<br>逻辑是：
<br>电脑 C （wireguard客户端） ———>服务器 A (wireguard服务端) ———>服务器 B（wireguard linux客户端） ———>校园网内网资源。
<br>电脑 C （wireguard客户端） ———>服务器 A (wireguard服务端) ———>电脑 B（wireguard windows客户端） ———>校园网内网资源。

<br>比如内网网段是 10.0.0.0/8，wireguard网段是10.7.0.0/24


## 1.安装wireguard

```bash
wget -O wireguard.sh https://get.vpnsetup.net/wg
sudo bash wireguard.sh --auto
```

生成客户端，一个客户端生成一次，拷贝json文件到客户端
参考：
https://github.com/hwdsl2/wireguard-install/blob/master/README-zh.md
## 2.配置allow-ip

给你的所有客户端里面的allowip改为

```bash
AllowedIPs = 10.7.0.0/24, 10.0.0.0/8
```

给把你的跳板客户端的allowip改为

```bash
AllowedIPs = 10.7.0.0/24
```
服务端里面，找到你想要作为nat跳板的peer的allowip改为
```bash
AllowedIPs = 10.7.0.0/24, 10.0.0.0/8
```
表示10.0.0.0/8使用这个节点
## (场景一)设置校园网内Linux Nat
开启内核转发
```bash
echo "net.ipv4.ip_forward = 1" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```
将客户端配置文件改成如下格式，其中eth0改为你自己的网口
```bash
[Interface]
Address = 10.7.0.2/24
PrivateKey = [服务器B的私钥]
# 核心：开启转发和 NAT，让电脑 C 能访问内网其他机器
PostUp = iptables -A FORWARD -i wg0 -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i wg0 -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE

[Peer]
PublicKey = [公钥]
PresharedKey = [公钥]
Endpoint = 221.12.18.205:51820
# 这里设置 VPN 内部全段
AllowedIPs = 10.7.0.0/24
PersistentKeepalive = 25
```
之后把文件放到/etc/wireguard/wg0.conf这里
使用命令：
```bash
wg-quick up wg0
```
启动该配置文件
## (场景二)设置校园网内windows NAT，注意，不是开启路由转发，开启路由转发需要本地路由器支持

```powershell
# 首先，找到你要设置的网卡的 InterfaceIndex，例如这里是 wg_server 
Get-NetAdapter
# 给网卡 wg_server 设置 IP 如果没有需要分配ip，因为前面已经有ip了所以不用
# New-NetIPAddress -IPAddress 172.22.0.1 -PrefixLength 24 -InterfaceIndex 68 # 68 是我的 wg_server 的 InterfaceIndex
# 添加 NAT
# Name: 设置 NAT的名称，随便起，我这里是 wgservernat。
# InternalIPInterfaceAddressPrefix: CIDR
New-NetNat -Name wgservernat -InternalIPInterfaceAddressPrefix 10.7.0.0/24
Get-NetNat 
```
<br>也可以用这个：https://github.com/micahmo/WgServerforWindows
<br>参考：https://kenvix.com/post/setup-nat-on-windows/
