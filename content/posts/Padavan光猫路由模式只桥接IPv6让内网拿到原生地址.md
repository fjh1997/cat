---
title: Padavan 在光猫路由模式下只桥接 IPv6，让内网拿到原生地址
abbrlink: 202610051
url: /posts/202610051.html
date: 2026-10-05 08:20:00
tags:
  - IPv6
  - Padavan
  - 光猫
  - 网络
  - 运维
---

背景：斐讯 K2 刷的是 RT-AC54U 的 Padavan。光猫工作在路由模式，K2 的 WAN（`eth2.2`）向上用 DHCP，地址落在光猫 LAN 的 `192.168.1.0/24`。K2 自己的 LAN 是 `br0`，`192.168.123.0/24`，下面接着 `eth2.1` 和 2.4G/5G 无线。

目标很明确：内网要原生公网 IPv6，不要 NAT66。路由器 WAN 口自己已经能用，内网不行。

## 一开始看到的现象

WAN 口通过 SLAAC 拿到一个全局地址，前缀长度是 64，默认路由指向光猫的 `fe80::1`。在路由器上 `ping6 2400:3200::1` 是通的。`br0` 只有链路本地地址，插网线的电脑也没有全局 IPv6。

光猫在 LAN 侧发 Router Advertisement，前缀标志是 `onlink` + `auto`，也就是让直连设备自己 SLAAC。下游这台路由器去要 DHCPv6-PD，拿不到可以再往下通告的前缀。

## 弯路：想把这个 /64 再切一段发给内网

SLAAC 要求前缀正好 64 位，后面 64 位是接口标识。把光猫给的 `/64` 切成 `/80` 之类再发 RA，Android 和不少系统会直接拒绝自动配置。所以「路由器自己根据 RA 再分一小段」这条路是走不通的。

光猫已经把这一个 `/64` 用在自己的 LAN 上。内网要共用它，就得在 IPv6 上和光猫处于同一个二层广播域，同时 IPv4 继续走 K2 原来的 NAT。光猫本身不改成桥接。

## 硬件 VLAN 不用动

MT7620 的交换芯片把口隔开了：

| VLAN | 成员 |
| --- | --- |
| 1 | LAN 口（0–3）+ CPU，对应 `eth2.1` |
| 2 | WAN 口（4）+ CPU，对应 `eth2.2` |

WAN 上的 RA 会进 CPU，出现在 `eth2.2` 上。软件桥可以把这个帧再从 `eth2.1`、`ra0` 送出去。硬件 VLAN 并没有挡住「经 CPU 转发」这条路。

反过来，如果把 WAN 口的 PVID 改成 1、并进 VLAN 1，WAN 和 LAN 就在交换芯片上直接二层互通。这种帧不经过 CPU，`ebtables` 看不见，IPv4 的 DHCP 也会泄到内网。这个改法要避开。VLAN 保持出厂划分。

## 可用的做法：IPv6 过桥，IPv4 继续路由

`ebtables` 的 `BROUTING` 链里，`DROP` 不是把包扔掉，而是把这一帧从桥上拿回来，交给原来那块网卡的三层协议栈。于是可以：

- `eth2.2` 加入 `br0`
- 从 `eth2.2` 进来的 IPv4（`0x0800`）和 ARP（`0x0806`）在 `BROUTING` 里 `DROP`，NAT 和 `192.168.1.2` 还在 `eth2.2` 上
- 目的 MAC 是 WAN 口自己的 IPv6 单播也同样 broute，路由器自己的 SLAAC 地址还能用
- 其余 IPv6，包括发往 `ff02::1` 的 RA，在桥上转发
- `FORWARD` 链再丢掉穿越 WAN 口的 IPv4 和 ARP，避免内网广播跑到光猫上
- `br0` 的 `multicast_snooping` 设为 0。否则没有 MLD querier 时，RA 组播到不了其他口

这台固件上 `nf_call_ip6tables` 本来就是 0，桥接的 IPv6 不会再被 `ip6tables` 的 `FORWARD DROP` 砍掉，所以不用改防火墙。

## 第一次把口加进桥之后，v4 和 v6 一起断了

`brctl show` 里 STP 是开的，`forward_delay` 读出来是 `1500`，单位是百分之一秒，也就是 15 秒。新加入的 `eth2.2` 会先 listening，再 learning。端口状态不是 `3`（forwarding）时，内核不会走进 broute，规则计数器一直是 0，回包被丢掉。当时 ping 光猫、`223.5.5.5`、`2400:3200::1` 全失败。

把 `forward_delay` 写成 0 会报 `Numerical result out of range`，合法范围从 2 秒起。这台 3.4 内核也不方便给单个口做 edge。处理是关掉整座桥的 STP：

```sh
brctl stp br0 off
```

端口马上变成 forwarding。IPv4 和路由器自己的 IPv6 都恢复了。家用这台没有环路，STP 关掉可以接受；代价是以后如果网线环回，没有生成树兜底。

## 有线验证

抓 `eth2.1` 能看到光猫的 RA 原样过来：前缀 `/64`，`onlink` + `auto`，路由器寿命 1800 秒。Windows 有线网卡 SLAAC 出全局地址，`ping 2400:3200::1` 通，`curl -6 https://www.cloudflare.com` 返回 200。IPv4 仍是 `192.168.123.0/24`，没有变成光猫的 `192.168.1.0/24`。

RA 里带的 MTU 是 1900。Windows 把接口 MTU 钳在 1500。1400 字节的 IPv6 ping 通，1800 字节不通，和这条以太网的实际 MTU 一致。

## WiFi 仍然没有 IPv6

有线已经在收 RA，2.4G 和 5G 没有。无线配置里 `IgmpSnEnable=1`，对应 nvram 的 `rt_IgmpSnEnable` 和 `wl_IgmpSnEnable`。Ralink / MT76x2 的 IGMP/MLD snooping 会丢掉还没有组成员的 IPv6 组播，`ff02::1` 的 RA 就在这里被吃掉。有线口不走这个驱动，所以不受影响。

当前生效，并写回 nvram：

```sh
iwpriv ra0 set IgmpSnEnable=0
iwpriv rai0 set IgmpSnEnable=0
nvram set rt_IgmpSnEnable=0
nvram set wl_IgmpSnEnable=0
nvram commit
```

主 SSID 关开一次 WiFi 就会发 Router Solicitation，光猫马上回 RA。访客 SSID 的 `NoForwardingMBCast=1`，组播本来就被禁，访客网络不会有 IPv6。

## 重启后还在

运行时的桥和 `ebtables` 重启就没了。脚本放在 `/etc/storage/ipv6_bridge.sh`，WAN up 的 `post_wan_script.sh` 和 `started_script.sh` 里各调一次，然后 `mtd_storage.sh save` 写进 Storage 分区。

脚本发现 `eth2.2` 已经在桥上、STP 已关、broute 规则还在时，不会重复刷规则，只会再补一次无线的 `iwpriv`。完整脚本：

```sh
#!/bin/sh
WAN=eth2.2
BR=br0
LOCK=/tmp/ipv6_bridge.lock

wifi_ipv6() {
	iwpriv ra0 set IgmpSnEnable=0 2>/dev/null
	iwpriv rai0 set IgmpSnEnable=0 2>/dev/null
	ip link set ra0 promisc on allmulticast on 2>/dev/null
	ip link set rai0 promisc on allmulticast on 2>/dev/null
}

i=0
while ! mkdir "$LOCK" 2>/dev/null; do
	i=$((i+1))
	[ "$i" -gt 15 ] && exit 0
	sleep 1
done
trap 'rmdir "$LOCK" 2>/dev/null' EXIT

[ -d "/sys/class/net/$WAN" ] || exit 0
[ -d "/sys/class/net/$BR" ] || exit 0

WANMAC=$(cat /sys/class/net/$WAN/address)
wifi_ipv6

if [ -d "/sys/class/net/$WAN/brport" ] \
	&& [ "$(cat /sys/class/net/$BR/bridge/stp_state)" = "0" ] \
	&& [ "$(cat /sys/class/net/$BR/bridge/multicast_snooping)" = "0" ] \
	&& ebtables -t broute -L | grep -q -- "-i $WAN"; then
	exit 0
fi

/usr/sbin/brctl stp "$BR" off
echo 0 > /sys/class/net/$BR/bridge/multicast_snooping

ebtables -t broute -F
ebtables -t broute -A BROUTING -i "$WAN" -p 0x0800 -j DROP
ebtables -t broute -A BROUTING -i "$WAN" -p 0x0806 -j DROP
ebtables -t broute -A BROUTING -i "$WAN" -p 0x86dd -d "$WANMAC" -j DROP

while ebtables -D FORWARD -i "$WAN" -p 0x0800 -j DROP 2>/dev/null; do :; done
while ebtables -D FORWARD -o "$WAN" -p 0x0800 -j DROP 2>/dev/null; do :; done
while ebtables -D FORWARD -i "$WAN" -p 0x0806 -j DROP 2>/dev/null; do :; done
while ebtables -D FORWARD -o "$WAN" -p 0x0806 -j DROP 2>/dev/null; do :; done
ebtables -A FORWARD -i "$WAN" -p 0x0800 -j DROP
ebtables -A FORWARD -o "$WAN" -p 0x0800 -j DROP
ebtables -A FORWARD -i "$WAN" -p 0x0806 -j DROP
ebtables -A FORWARD -o "$WAN" -p 0x0806 -j DROP

if [ ! -d "/sys/class/net/$WAN/brport" ]; then
	/usr/sbin/brctl addif "$BR" "$WAN"
fi

i=0
while [ -d "/sys/class/net/$WAN/brport" ] \
	&& [ "$(cat /sys/class/net/$WAN/brport/state)" != "3" ] \
	&& [ "$i" -lt 10 ]; do
	i=$((i+1))
	sleep 1
done

logger -t ipv6bridge "IPv6 bridge ready state=$(cat /sys/class/net/$WAN/brport/state 2>/dev/null)"
```

另外，这台 Padavan 上 `/sbin/reboot` 是指向 `rc` 的符号链接，不能把它当成普通的 `reboot` 命令。

## 结果

- 路由器 WAN：继续 SLAAC，IPv4 NAT 不变
- 有线和主 WiFi：使用光猫通告的同一个 `/64`，不经过 NAT66
- 前缀变化时不用改规则，RA 是原样桥过去的
- 交换芯片的 VLAN 保持 WAN/LAN 隔离，跨网段的 IPv6 必须走 CPU，IPv4 才能被 broute 留在路由栈上
