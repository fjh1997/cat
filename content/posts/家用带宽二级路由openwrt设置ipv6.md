---
title: 家用带宽二级路由openwrt设置ipv6
abbrlink: 36951
url: /posts/36951.html
date: 2020-07-22 11:04:37
tags:
---

拓扑结构，中国移动家庭智能网关GS3101 + OpenWrt GCC 5.3.0 12009
GS3101 为一级主路由，是光猫直接拨号，通过GS3101到一个lan口接到openwrt的wan口。其中分配给gs3101网关的ipv6前缀是60位,二级路由获取到该前缀后，给二级路由下属设备分配的前缀是64位
成功的配置需要确保你的二级路由器获得的ipv6的前缀是64而不是128。
![在这里插入图片描述](/images/62a64f147a5dc00d8e9fd803bc91c584.png)


gs3101网关设置如下：
默认登录用户名CMCCAdmin，密码aDm8H%MdA
![在这里插入图片描述](/images/3c3810412a7dab9ccc89b74c89f7a07e.png)


![在这里插入图片描述](/images/9c74d0db0c1fb11e54ef7fcbc1bf4bad.png)
如果自动分配不成功，则自己分配，注意前缀必须和家庭网关状态里面的前缀相同，前缀长度大于60即可：
![在这里插入图片描述](/images/956275d4f1f50154f6b9586226296464.png)
![在这里插入图片描述](/images/696679760c59ff4d461d92170b9efdf9.png)


我openwrt用ssh连上后用vim设置如下：
开头注释那行为路径
```bash
# /etc/config/firewall
config defaults
	option syn_flood	1
	option input		ACCEPT
	option output		ACCEPT
	option forward		ACCEPT
# Uncomment this line to disable ipv6 rules
#	option disable_ipv6	1

config zone
	option name		lan
	list   network		'lan'
	option input		ACCEPT
	option output		ACCEPT
	option forward		ACCEPT

config zone
	option name		wan
	list   network		'wan'
	list   network		'wan6'
	option input		ACCEPT
	option output		ACCEPT
	option forward		ACCEPT
	option masq		1
	option mtu_fix		1

config forwarding
	option src		lan
	option dest		wan

config forwarding
	option src		wan
	option dest		lan


# We need to accept udp packets on port 68,
# see https://dev.openwrt.org/ticket/4108
config rule
	option name		Allow-DHCP-Renew
	option src		wan
	option proto		udp
	option dest_port	68
	option target		ACCEPT
	option family		ipv4

# Allow IPv4 ping
config rule
	option name		Allow-Ping
	option src		wan
	option proto		icmp
	option icmp_type	echo-request
	option family		ipv4
	option target		ACCEPT

config rule
	option name		Allow-IGMP
	option src		wan
	option proto		igmp
	option family		ipv4
	option target		ACCEPT

# Allow DHCPv6 replies
# see https://dev.openwrt.org/ticket/10381
config rule
	option name		Allow-DHCPv6
	option src		wan
	option proto		udp
	option src_ip		fc00::/6
	option dest_ip		fc00::/6
	option dest_port	546
	option family		ipv6
	option target		ACCEPT

config rule
	option name		Allow-MLD
	option src		wan
	option proto		icmp
	option src_ip		fe80::/10
	list icmp_type		'130/0'
	list icmp_type		'131/0'
	list icmp_type		'132/0'
	list icmp_type		'143/0'
	option family		ipv6
	option target		ACCEPT

# Allow essential incoming IPv6 ICMP traffic
config rule
	option name		Allow-ICMPv6-Input
	option src		wan
	option proto	icmp
	list icmp_type		echo-request
	list icmp_type		echo-reply
	list icmp_type		destination-unreachable
	list icmp_type		packet-too-big
	list icmp_type		time-exceeded
	list icmp_type		bad-header
	list icmp_type		unknown-header-type
	list icmp_type		router-solicitation
	list icmp_type		neighbour-solicitation
	list icmp_type		router-advertisement
	list icmp_type		neighbour-advertisement
	option limit		1000/sec
	option family		ipv6
	option target		ACCEPT

# Allow essential forwarded IPv6 ICMP traffic
config rule
	option name		Allow-ICMPv6-Forward
	option src		wan
	option dest		*
	option proto		icmp
	list icmp_type		echo-request
	list icmp_type		echo-reply
	list icmp_type		destination-unreachable
	list icmp_type		packet-too-big
	list icmp_type		time-exceeded
	list icmp_type		bad-header
	list icmp_type		unknown-header-type
	option limit		1000/sec
	option family		ipv6
	option target		ACCEPT

# include a file with users custom iptables rules
config include
	option path /etc/firewall.user


### EXAMPLE CONFIG SECTIONS
# do not allow a specific ip to access wan
#config rule
#	option src		lan
#	option src_ip	192.168.45.2
#	option dest		wan
#	option proto	tcp
#	option target	REJECT

# block a specific mac on wan
#config rule
#	option dest		wan
#	option src_mac	00:11:22:33:44:66
#	option target	REJECT

# block incoming ICMP traffic on a zone
#config rule
#	option src		lan
#	option proto	ICMP
#	option target	DROP

# port redirect port coming in on wan to lan
#config redirect
#	option src			wan
#	option src_dport	80
#	option dest			lan
#	option dest_ip		192.168.16.235
#	option dest_port	80
#	option proto		tcp

# port redirect of remapped ssh port (22001) on wan
#config redirect
#	option src		wan
#	option src_dport	22001
#	option dest		lan
#	option dest_port	22
#	option proto		tcp

# allow IPsec/ESP and ISAKMP passthrough
config rule
	option src		wan
	option dest		lan
	option proto		esp
	option target		ACCEPT

config rule
	option src		wan
	option dest		lan
	option dest_port	500
	option proto		udp
	option target		ACCEPT

### FULL CONFIG SECTIONS
#config rule
#	option src		lan
#	option src_ip	192.168.45.2
#	option src_mac	00:11:22:33:44:55
#	option src_port	80
#	option dest		wan
#	option dest_ip	194.25.2.129
#	option dest_port	120
#	option proto	tcp
#	option target	REJECT

#config redirect
#	option src		lan
#	option src_ip	192.168.45.2
#	option src_mac	00:11:22:33:44:55
#	option src_port		1024
#	option src_dport	80
#	option dest_ip	194.25.2.129
#	option dest_port	120
#	option proto	tcp
```
```bash
#/etc/config/network
config interface 'loopback'
	option ifname 'lo'
	option proto 'static'
	option ipaddr '127.0.0.1'
	option netmask '255.0.0.0'

config globals 'globals'
	option ula_prefix 'fd86:c80c:828a::/48'

config interface 'lan'
	option type 'bridge'
	option ifname 'eth0'
	option proto 'static'
	option ipaddr '192.168.2.1'
	option netmask '255.255.255.0'
	option ip6assign '64'

config interface 'wan'
	option ifname 'eth1'
	option proto 'dhcp'

config interface 'wan6'
	option ifname 'eth1'
	option proto 'dhcpv6'

config switch
	option name 'switch0'
	option reset '1'
	option enable_vlan '1'

config switch_vlan
	option device 'switch0'
	option vlan '1'
	option ports '1 2 3 4 0'
```
```bash
#/etc/config/dhcp

config dnsmasq
	option domainneeded '1'
	option boguspriv '1'
	option filterwin2k '0'
	option localise_queries '1'
	option rebind_protection '1'
	option rebind_localhost '1'
	option local '/lan/'
	option domain 'lan'
	option expandhosts '1'
	option nonegcache '0'
	option authoritative '1'
	option readethers '1'
	option leasefile '/tmp/dhcp.leases'
	option resolvfile '/tmp/resolv.conf.auto'
	option localservice '1'

config dhcp 'lan'
	option interface 'lan'
	option start '100'
	option limit '150'
	option leasetime '12h'
	option dhcpv6 'relay'
        option ra 'relay'
        option ndp 'relay'
config dhcp 'wan'
	option interface 'wan'
	option ignore '1'
config dhcp 'wan6'
        option interface 'wan'
	option dhcpv6 'relay'
        option ra 'relay'
        option ndp 'relay'
        option master '1'

config odhcpd 'odhcpd'
	option maindhcp '0'
	option leasefile '/tmp/hosts/odhcpd'
	option leasetrigger '/usr/sbin/odhcpd-update'
```
另外还设置了ip6tables
```bash
ip6tables -F
ip6tables -X
ip6tables -P INPUT ACCEPT
ip6tables -P OUTPUT ACCEPT
ip6tables -P FORWARD ACCEPT
```
设置完需要重启网络，防火墙，odhcpd
```bash
/etc/init.d/network reload
/etc/init.d/firewall reload 
/etc/init.d/odhcpd restart
```
设置完毕，可能你在二级设备下要上网的设备需要ping一次家庭网关以建立链路刷新邻居表，登录管理页面状态，获得家庭网关的ipv6地址，然后macos或者Linux使用ping6命令ping即可。
windows使用ping -6命令。
