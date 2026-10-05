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

## 正常的光猫是怎么分 IPv6 的

家庭宽带上，IPv6 不该靠下游路由器去蹭光猫 LAN 的那一个网段。规范做法是前缀委托：光猫和家用路由器各管各的 `/64`，中间是路由，不是同一个广播域。

运营商先把一段前缀交给光猫，常见是 `/56`（能切出 256 个 `/64`）或 `/60`（16 个 `/64`）。光猫自己的 LAN 只用其中第一段 `/64`：发 Router Advertisement，前缀标志是 `onlink` + `auto`，直连设备 SLAAC。剩下的前缀留给下游。

接在光猫 LAN 上的家用路由器做两件不同的事：

- 要一个地址，用来和光猫通信。SLAAC 或 DHCPv6 IA-NA 都可以。这个地址落在光猫自己的那个 `/64` 里，只是上联链路。
- 再发 IA-PD，向光猫要一段可以继续往下发的前缀。光猫从剩下的前缀里切一个 `/64`（或更大一块）回去，并在自己的路由表里加一条：这段前缀的下一跳是下游路由器的链路本地地址。

下游路由器拿到自己的前缀之后，在自己的 LAN 上另发一条 RA。电脑和手机 SLAAC 出来的地址属于路由器的 `/64`，默认网关是路由器，不是光猫。光猫只把这一段路由给下游，看不见内网设备的 MAC，也不参与它们的邻居发现。

示意用的是文档前缀，不是这条线路上的真实地址：

```
运营商 ──PD /60──► 光猫
                    ├─ 自己的 LAN：2001:db8:abcd:0::/64   （RA，给直连设备）
                    └─ 委托出去：  2001:db8:abcd:1::/64   （IA-PD，下一跳是下级路由器）
                                      │
                                   家用路由器
                                      └─ 自己的 LAN：2001:db8:abcd:1::/64 （另一条 RA）
```

IPv4 可以继续 NAT。IPv6 是纯三层转发，WAN 和 LAN 仍然是两个广播域。访客、IoT 还能再各切一个 `/64`。路由器的 `ip6tables` 看得到转发的 IPv6。

如果运营商只委托了一个 `/64`，光猫又把整段用在自己的 LAN 上，就没有剩余前缀可以再委托。这时正规做法是让运营商改发 `/56` 或 `/60`，或者把光猫改成桥接，由下游路由器自己拨号去拿 PD。这次两条都没走：光猫保持路由模式，内网也不做 NAT66。

## 这次实际差在哪

| | 正常委托 | 这次 |
| --- | --- | --- |
| 光猫向下 | 另给一段前缀 | 下游要 PD，没有可用前缀 |
| 内网前缀 | 和光猫 LAN 不是同一个 `/64` | 和光猫 LAN 共用一个 `/64` |
| 内网的默认网关 | 家用路由器 | 光猫。RA 是光猫发的，经桥原样过来 |
| 邻居发现 | 各子网自己做 | 内网和光猫在同一个 IPv6 广播域 |
| IPv4 | 和 IPv6 互不干扰 | 仍然 NAT，靠 broute 把 IPv4 留在路由栈 |
| 路由器防火墙 | 能过滤转发的 IPv6 | 桥上的 IPv6 不进 `ip6tables` |

路由器 WAN 口自己是通的。它 SLAAC 拿到光猫通告的 `/64`，默认路由指向光猫的 `fe80::1`，从路由器 `ping6 2400:3200::1` 没问题。`br0` 上没有全局前缀，插在 K2 下面的设备就没有地址。通告是存在的，缺的是另一段可以再通告的前缀。

## 排查里的判断

光猫路由表里一度叠着三样东西：一条更短的前缀挂在 `lo` 上，自己的 LAN 用掉其中一个 `/64`，另外一个 `/64` 经由某台设备的链路本地地址指向别处。这看起来像光猫已经在做前缀委托，而且委托对象不是这台 K2。

同一时间，K2 上的 dhcp6c 停在 Solicit，往 `ff02::1:2` 重发，syslog 里没有 Advertise。所以不是「前缀已经分下来，只是没写进 `br0`」，而是协商没完成。后来能确认光猫的 dhcp6s 对这类请求会回 Advertise，状态是 `NoPrefixAvail`。服务器在听，只是不给前缀。

中间有几个判断后来站不住：

1. dhcp6c 里的 `sla-len 0`。它的意思是拿到的前缀不再切短，只在已经拿到一段比 `/64` 更短的前缀时才有意义。客户端根本没收到前缀，改 `sla-len` 改变不了 `NoPrefixAvail`。
2. 光猫保存的 WAN 前缀长度写成 `/64`，和路由表里那条更短的聚合前缀对不上。不能据此说「运营商只给了 `/64`，物理上不可能再委托」。`/64` 不能再切给另一个 SLAAC 子网，这是对的；但两种长度记录互相矛盾，说明当时看到的并不是单一事实。能确定的只有：这版固件没有把一段新前缀交给这台新的下游路由器。
3. dhcp6s 的配置里有 IA-NA 的单地址池，也有一条写死的 host 静态前缀，没有给新客户端用的 PD 池。二进制里能找到 IA-NA 的分配函数，没找到名字里带 `iapd` 的分配函数，同时又还留着前缀绑定过期、释放的字符串。少一个符号不能证明分配代码被删了。改 DUID、改那条静态 host，新请求仍然是 `NoPrefixAvail`。这次够用的结论是：当前固件不会给新设备下发 PD，不是 Padavan 少写了一行配置。
4. 路由表里「另一个 `/64` 指向另一台设备」，后来也对不上一次新的 PD。那台设备更像是接在光猫 LAN 上，用同一条 RA 做了 SLAAC。K2 的 WAN 口已经是这种状态。内网缺的不是再要一次 DHCPv6，而是让光猫的 RA 到达 K2 下面的设备。

因此剩下的选择是：

- 思路 1：K2 改成 AP，WAN 和 LAN 纯二层。IPv6 能通，IPv4 的 NAT 和自己的网段也没了。
- 思路 2：IPv4 继续路由，IPv6 用 NDP 代理加 RA 中继。逻辑上还是隔着路由器，靠代理回答邻居发现。这台 Padavan 没有 ndppd、odhcpd。
- 思路 3：只把 IPv6 帧桥过去，IPv4 和 ARP 继续走原来的 NAT。RA、SLAAC、DAD 都是光猫那个 `/64` 上的原生行为。选了这条。

还有一条当时想过、标准上走不通的路：路由器从自己收到的 RA 里再切一段，比如 `/80`，发给内网。SLAAC 规定前缀必须是 64 位，后面 64 位才是接口标识。切短之后 Android 不会自动配置，它也不做 DHCPv6。所以不能自己根据 RA 分一小段，只能让内网和光猫共用这一个 `/64`。

硬件 VLAN 那次改法也是错的。WAN 口和 LAN 口的 VLAN 都包含 CPU，RA 已经能进 `eth2.2`。要送到 `eth2.1`，在软件桥上转发就行。当时以为硬件 VLAN 在帧进 CPU 之前就把它挡住了，于是把 WAN 口并进 LAN 的 VLAN。这样帧在交换芯片上直接过去，不进 CPU，`ebtables` 拦不住，光猫的 IPv4 DHCP 会泄到内网。VLAN 保持原样。


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

这不是正常的前缀委托。正常情况下内网应该拿到光猫另外委托的一段 `/64`，默认网关是 K2。现在内网和光猫 LAN 上的设备挤在同一个 `/64` 里，默认网关是光猫，K2 只负责把 IPv6 帧桥过去，IPv4 仍走 NAT。

- 路由器 WAN：继续 SLAAC，IPv4 NAT 不变
- 有线和主 WiFi：使用光猫通告的同一个 `/64`，不经过 NAT66
- 前缀变化时不用改规则，RA 是原样桥过去的
- 交换芯片的 VLAN 保持 WAN/LAN 隔离，跨网段的 IPv6 必须走 CPU，IPv4 才能被 broute 留在路由栈上
- 代价是没有第二段前缀可分给访客或 IoT，邻居数量和 ND 都堆在光猫上，K2 的 `ip6tables` 也看不见这些桥接流量
