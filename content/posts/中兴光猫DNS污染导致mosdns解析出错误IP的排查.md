---
title: 中兴光猫 DNS 污染：本地 mosdns 把 IPv4 域名解析成 IPv6 和陌生 IP 的排查
abbrlink: 202610021
url: /posts/202610021.html
date: 2026-10-02 09:30:00
tags:
  - DNS
  - mosdns
  - 光猫
  - 网络
  - 运维
---

背景：Windows 本机跑了一个 mosdns-x（v4.6.0）做本地 DNS，网卡 DNS 指向 `127.0.0.1`，上游是光猫加几个国内公共 DNS。某天发现自己在 Cloudflare 上只绑了一条 A 记录的域名 `x.mydomain.top`，其他机房解析都是正常的 IPv4，唯独本机 `ping` 出来是 IPv6；处理完 IPv6 之后，它又变成了一组完全不认识的新加坡 IP。

结论先放这里：**问题出在中兴光猫（型号 ZN-M180G，地址 `192.168.1.254`）的 DNS 服务存在 DNS 污染**，会对一部分域名返回一组固定的假地址（TTL 3600），连 `example.com` 都不放过。mosdns 把光猫配成了上游，光猫在局域网里响应最快，于是假地址被 mosdns 采纳并缓存，最终传到了系统里。

下面是完整排查过程，包括中间走过的一段弯路。

## 现象一：只有 A 记录的域名被解析出 AAAA

```powershell
PS> Resolve-DnsName x.mydomain.top

Name           Type TTL  IPAddress
----           ---- ---  ---------
x.mydomain.top AAAA 2320 2406:cb42:0:2017::2
x.mydomain.top AAAA 2320 2406:cb42:0:2018::2
x.mydomain.top A    73   <服务器IPv4>
```

两个疑点：

1. Cloudflare 上根本没有配 AAAA；
2. AAAA 的 TTL 是 2320，A 记录只有 73。权威给的 A 记录 TTL 是 300，说明这两组记录**不是同一时间、同一来源**写进缓存的。

### 逐个上游对比

既然本机走的是 mosdns，就把 mosdns 和它配置里的每个上游、以及权威服务器挨个问一遍 AAAA：

| 查询对象 | AAAA 结果 |
| --- | --- |
| `127.0.0.1`（mosdns） | `2406:cb42:0:2017::2`、`2406:cb42:0:2018::2` |
| `henry.ns.cloudflare.com`（权威） | 无，只返回 SOA |
| `1.1.1.1` / `8.8.8.8` | 无 |
| `223.5.5.5` / `223.6.6.6` / `119.29.29.29` | 无 |
| `192.168.1.254`（光猫） | 无 |

只有 mosdns 自己"记得"这两条 IPv6，说明它们来自 mosdns 的缓存。查了一下归属，`2406:cb42::/48` 属于 Shock Hosting LLC，跟我的服务器没有任何关系。

### mosdns 的配置

```yaml
plugins:
  - tag: cache
    type: cache
    args:
      size: 4096
      lazy_cache_ttl: 86400

  - tag: forward_default
    type: fast_forward
    args:
      upstream:
        - addr: "192.168.1.254"
          trusted: true
        - addr: "223.5.5.5"
          trusted: true
        - addr: "223.6.6.6"
          trusted: true
        - addr: "119.29.29.29"
          trusted: true
```

两个关键点：

- `fast_forward` 会**并发**请求所有上游，`trusted: true` 的上游只要先回来就直接采用（见 `pkg/bundled_upstream` 的 `ExchangeParallel`）。光猫在局域网里，几乎每次都是第一个回来的；
- `lazy_cache_ttl: 86400` 开启了乐观缓存：应答过期后最多还能保留一天，命中时先返回旧应答，再在后台刷新。

### 弯路：一开始以为是 Cloudflare 的旧记录

这时候我的第一反应是：Cloudflare 上曾经有过这两条 AAAA，后来删掉了，某个上游递归还没过期，mosdns 在重启时正好把旧记录缓存了下来。

重启 mosdns 之后，`127.0.0.1` 的 AAAA 确实变成了空的，看起来"解决了"。但 `ping` 仍然走 IPv6：

```powershell
PS> ping x.mydomain.top
Pinging x.mydomain.top [2406:cb42:0:2017::2] with 32 bytes of data:

PS> ping -6 x.mydomain.top
Ping request could not find host x.mydomain.top.
```

`ping -6` 找不到主机，不带参数却走 IPv6，原因是 **Windows 自己的 DNS Client 缓存**里还留着重启前那两条 AAAA（`ipconfig /displaydns` 能看到，剩余 TTL 1600 多秒）。`ping` 和 .NET 的 `Dns.GetHostAddresses` 都先查这层缓存：

```powershell
PS> [System.Net.Dns]::GetHostAddresses('x.mydomain.top')
InterNetworkV6 2406:cb42:0:2017::2
InterNetworkV6 2406:cb42:0:2018::2
InterNetwork   <服务器IPv4>

PS> ipconfig /flushdns
PS> ping x.mydomain.top
Pinging x.mydomain.top [<服务器IPv4>] with 32 bytes of data:
```

清掉系统缓存后恢复正常。但"Cloudflare 旧记录"这个解释其实站不住：我从头到尾**没有在权威服务器上查到过**这两条 AAAA，只是推测。下一个现象证明了真正的来源。

## 现象二：又被解析成一组新加坡 IP

半小时后，同一个域名开始解析到一组 7 个 IPv4：

```powershell
PS> Resolve-DnsName x.mydomain.top -Type A

Name           Type TTL  IPAddress
----           ---- ---  ---------
x.mydomain.top A    2817 182.16.61.114
x.mydomain.top A    2817 182.16.61.115
x.mydomain.top A    2817 141.193.154.70
x.mydomain.top A    2817 182.16.61.116
x.mydomain.top A    2817 182.16.61.118
x.mydomain.top A    2817 182.16.61.117
x.mydomain.top A    2817 141.193.154.210
```

更诡异的是，这组 IP 我在之前的系统缓存里见过——当时它挂在我另一个子域 `d4.mydomain.top` 名下，而 `d4` 在公共 DNS 上的真实地址是另一台服务器。

这次不再只问一次，而是**对每个上游连续问 8 次**：

```
192.168.1.254
   5x  x.mydomain.top -> 182.16.61.118 / .116 / .115 ...  TTL 3455
   3x  x.mydomain.top -> 182.16.61.117 / .114 / 141.193.154.210 ...  TTL 3455
223.5.5.5
   8x  x.mydomain.top -> <服务器IPv4>  TTL 225~286
223.6.6.6
   8x  x.mydomain.top -> <服务器IPv4>  TTL 225~286
119.29.29.29
   8x  x.mydomain.top -> <服务器IPv4>  TTL 300
```

**只有光猫在返回这组假地址**，而且 TTL 接近 3600，远大于权威的 300。

## 实锤：光猫对 example.com 也返回同一组假 IP

为了排除"我自己的域名配置有问题"，拿一组无关域名同时问光猫和 DNSPod：

| 域名 | 光猫 `192.168.1.254` | DNSPod `119.29.29.29` |
| --- | --- | --- |
| `x.mydomain.top` | `182.16.61.117`、`182.16.61.114`、`141.193.154.210`…（TTL 3428） | `<服务器IPv4>`（TTL 273） |
| `d4.mydomain.top` | 已恢复为真实地址（TTL 600） | 真实地址 |
| `k4.mydomain.top` | 真实地址 | 真实地址 |
| 随机不存在的子域 | NXDOMAIN | NXDOMAIN |
| `www.baidu.com` | 正常 | 正常 |
| **`example.com`** | **`182.16.61.116`、`182.16.61.115`、`141.193.154.70`…（TTL 3301）** | `172.66.147.243`、`104.20.23.154` |

`example.com` 被光猫解析到了**和 `x.mydomain.top` 完全相同的那组 IP**。这组地址的归属：

```
182.16.61.0/24   AS963  N963 PTE. LTD.（新加坡）
141.193.154.0/24 AS963  N963 PTE. LTD.（新加坡）
```

光猫的管理页面标题是 `ZN-M180G`，HTTP 头 `Server: Mini web server 1.0 ZTE corp 2005.`，确认是中兴的设备。

几个特征放在一起：

- **一组固定的假 IP 池**，同一时刻被分配给多个毫不相关的域名（`example.com`、我的子域）；
- **TTL 固定在 3600 左右**，和权威 TTL 无关；
- **会在域名之间轮换**：早上挂在 `d4` 上，`d4` 恢复之后又出现在 `x` 上；
- 只有走光猫 DNS 才会出现，直接问阿里、DNSPod、Google、CNNIC（1.2.4.8）都是正确结果。

这就是典型的 DNS 污染。回头看现象一的那两条 IPv6：它们和光猫塞给 `d4` 的假 A 记录**写入时间都在 08:21 左右、TTL 都是 3600、都在 09:21 左右到期**，几乎可以确定是同一次污染的产物，而不是 Cloudflare 的旧记录。

> 需要说明的是：我是从局域网直接问光猫的 `192.168.1.254:53` 拿到的污染结果，至于是光猫固件自己改写的，还是光猫转发给的运营商递归 DNS 返回的，从局域网这一侧没法区分。但对终端用户来说结论是一样的：**把中兴光猫当 DNS 用，就会拿到被污染的结果。**

## 修复

把光猫从 mosdns 的上游里去掉，只保留公共 DNS：

```yaml
  - tag: forward_default
    type: fast_forward
    args:
      upstream:
        - addr: "223.5.5.5"
          trusted: true
        - addr: "223.6.6.6"
          trusted: true
        - addr: "119.29.29.29"
          trusted: true
```

mosdns 以 Windows 服务运行，重启需要管理员权限，然后清掉系统缓存：

```powershell
Restart-Service mosdns
ipconfig /flushdns
```

验证：

```powershell
PS> Resolve-DnsName x.mydomain.top -Server 127.0.0.1 -DnsOnly
x.mydomain.top  A  235  <服务器IPv4>

PS> Resolve-DnsName x.mydomain.top -Type AAAA -Server 127.0.0.1 -DnsOnly
mydomain.top    SOA 235

PS> Resolve-DnsName example.com -Server 127.0.0.1 -DnsOnly
example.com  A  172.66.147.243
example.com  A  104.20.23.154

PS> ping x.mydomain.top
Reply from <服务器IPv4>: bytes=32 time=136ms TTL=52
```

另外注意：WLAN 网卡的 DNS 仍然是 DHCP 下发的 `192.168.1.254`。走这块网卡的查询会绕过 mosdns 直接问光猫，同样会被污染，建议也改成 `127.0.0.1` 或公共 DNS。

## 小结

| 层级 | 现象 | 原因 | 处理 |
| --- | --- | --- | --- |
| 中兴光猫 DNS | 返回 AS963 的假 IP / 假 AAAA，TTL 3600 | DNS 污染 | 不再使用光猫作为 DNS |
| mosdns `fast_forward` | 采纳了光猫的假应答 | 并发上游 + `trusted: true`，局域网光猫总是最快 | 从上游列表删除光猫 |
| mosdns `cache` | 重启前一直返回旧的假应答 | 内存缓存 + `lazy_cache_ttl` 乐观缓存 | 重启 mosdns |
| Windows DNS Client | mosdns 已正确，`ping` 仍走 IPv6 | 系统缓存残留 | `ipconfig /flushdns` |

经验总结：

- **不要把光猫当作 DNS 上游**，尤其不要把它放在并发上游里还标 `trusted: true`。它在局域网里永远最快，一旦被污染，并发转发会把错误结果原封不动地选中；
- 排查 DNS 问题时，**每个上游要连续问多次**，并且拿 `example.com` 这类无关域名做对照。单次查询很容易恰好碰到正常结果而误判；
- 注意 TTL：一个只设了 300 的记录，查出来 TTL 是 2000、3000 多，基本就不是从权威那里来的；
- 服务端 DNS 修好之后，客户端还有一层系统缓存。`ping -6` 找不到主机、但 `ping` 却走 IPv6，就是这层缓存在作怪；
- 排查过程中的推测要拿证据验证。我一开始的"Cloudflare 旧记录"结论只是推测，直到对照实验才找到真正的源头。
