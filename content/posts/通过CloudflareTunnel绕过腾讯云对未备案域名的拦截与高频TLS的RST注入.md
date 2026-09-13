---
title: 用 Cloudflare Tunnel 绕过腾讯云对未备案域名的拦截与高频 TLS 的 RST 注入
abbrlink: 202609131
url: /posts/202609131.html
date: 2026-09-13 21:20:00
tags:
  - Cloudflare
  - 腾讯云
  - 隧道
  - CDN
  - 网络
  - 运维
---

背景：给学校 Web 安全课搭靶场，腾讯云大陆服务器（Ubuntu 24.04）上跑了三个靶站，用 nginx 按 Host 分流到 bug1/bug2/bug3 三个子域。域名没备案，于是踩了一整条腾讯云拦截链，最后用 Cloudflare Tunnel 一步到位。本文记录完整的排查和绕过过程。

## 第一层拦截：未备案域名的 80 端口

腾讯云对大陆服务器上未备案的域名拦截方式很明确：**按 Host 头拦明文 HTTP**。不管你跑在 80 还是 8080 之类任意端口，只要请求里 Host 是未备案域名，都会被 302 到 dnspod 的 webblock 页面。

但 **443 的 TLS + SNI 不拦**——TLS 握手之后腾讯看不到 Host 头，SNI 检查又没做。

所以第一版方案：域名托管到 Cloudflare（橙云），SSL 模式设 **Full**。这样访客不管走 http 还是 https，CF 都从 443 回源，完全绕开 80 端口的明文拦截。三站全通，稳定跑了一段时间。

## 第二层：CF 的两个副作用

上 POC 扫描工具（dddd，nuclei 内核）后遇到两个问题：

**1. Bot 防护按 UA 拦截（error 1010）**。扫描器目录探测用的 UA 是 `Python-urllib/2.5`，直接被 CF 403。关掉 Bot Fight Mode 和 Browser Integrity Check 即可。

**2. CF 替换响应头导致被动指纹丢失**。CF 会把源站的 `Server:` 头改写成 `cloudflare`，其他特征头也可能剥离。我的扫描器靠被动指纹（响应头/body 特征）来决定打哪些 POC，指纹丢了 POC 就不触发。修复方式是在源站 nginx 加自定义头：

```nginx
add_header X-Powered-By "ThinkPHP" always;
```

CF 对自定义头是透传的，指纹恢复，扫描正常命中。到这里一切正常——直到某天扫描突然全挂。

## 第三层：腾讯云 CC/DDoS 防护的 RST 注入

某天集中跑了很多轮批量扫描之后，所有请求开始返回 **Cloudflare error 525**（CF 与源站 SSL 握手失败）。排查过程：

1. 服务器本机 `curl https://127.0.0.1` → 200，源站 nginx 本身没问题
2. 直连源站 IP 的 443（`--resolve` 绕过 DNS）→ 也失败，errno 113。**不是 CF 单向的问题**
3. SSH（22 端口）完全正常 → 不是整机断网
4. 服务器上 tcpdump 抓包，看到关键现象：

```
CF 的 TCP 握手 + ClientHello 到达源站，内核正常 ACK，
但 nginx 的 ServerHello 从未发出，约 52μs 后一个 RST 把连接掐断。
```

这个 52μs 的 RST 是**注入的**——腾讯云的 CC/DDoS 防护识别到境外 IP（CF 回源节点）的高频 TLS 连接，直接在链路上注入 RST。而且它是**概率性**的：反复测试发现不是按域名拦、也不是按 IP 无差别拦，时好时坏，成功率飘忽。等几个小时也不会完全恢复，半激活状态会持续很久。

结论：只要流量从**入站方向**进 443，无论直连还是过 CDN，都可能被干扰。

## 解法：Cloudflare Tunnel 出站隧道

思路很直接：腾讯云拦的是入站，那让源站**主动向外**建立持久连接，访问流量全部从隧道里走，入站拦截彻底失效。

### 步骤

**1. 安装 cloudflared**（服务器连不上 GitHub，本地走代理下载再 scp 上去）：

```bash
curl -sL -x http://127.0.0.1:10808 -o cloudflared-linux-amd64.deb \
  "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb"
scp cloudflared-linux-amd64.deb root@服务器IP:/tmp/
dpkg -i /tmp/cloudflared-linux-amd64.deb
```

**2. 授权并创建隧道**：

```bash
cloudflared tunnel login        # 浏览器打开链接，选择域名授权
cloudflared tunnel create lab-tunnel
```

**3. 写配置** `/root/.cloudflared/config.yml`：

```yaml
tunnel: <tunnel-uuid>
credentials-file: /root/.cloudflared/<tunnel-uuid>.json

ingress:
  - hostname: bug1.example.com
    service: http://127.0.0.1:80
  - hostname: bug2.example.com
    service: http://127.0.0.1:80
  - hostname: bug3.example.com
    service: http://127.0.0.1:80
  - service: http_status:404
```

ingress 指向 `127.0.0.1:80`，nginx 继续按 server_name 分流，**原有 vhost 配置一行不用改**。

**4. 切换 DNS**。先把域名上原有的三条 A 记录（橙云指向服务器 IP）删掉，再绑隧道 CNAME：

```bash
cloudflared tunnel route dns lab-tunnel bug1.example.com
cloudflared tunnel route dns lab-tunnel bug2.example.com
cloudflared tunnel route dns lab-tunnel bug3.example.com
```

不删旧 A 记录会报 already exists 冲突。

**5. 装成 systemd 服务**（重启不丢）：

```bash
cloudflared service install
systemctl enable --now cloudflared
```

### 效果

cloudflared 建立了 4 条 QUIC 出站连接（落地在 LAX/SJC），三站全部恢复 200，之前加的 `X-Powered-By` 自定义指纹头照样透传，扫描器 21 发命中全部恢复，之后多轮扫描零失败。

## 小结

| 层级 | 拦截方式 | 绕过方式 |
| --- | --- | --- |
| 未备案域名 80 端口 | 按 Host 头 302 webblock | CF 橙云 Full 模式 443 回源 |
| CF Bot 防护 | 按 UA 403（error 1010） | 关 Bot Fight Mode / 换 UA |
| CF 头改写 | 被动指纹丢失 | 源站加自定义头，CF 透传 |
| CC/DDoS 防护 RST 注入 | 入站高频 TLS 注入 RST（概率性） | **Cloudflare Tunnel 出站隧道** |

经验总结：

- 腾讯云对未备案域名的明文 HTTP 是死路，443 TLS+SNI 是活路，但活路会被 CC 防护的概率性 RST 注入污染
- 遇到 525 + 直连源站握手失败 + 本机正常 + SSH 正常的组合，优先怀疑链路中间的防护设备，抓包看 RST 时序（μs 级 RST 基本就是注入）
- 出站隧道是治本方案：云厂商对出站方向的管控远松于入站，cloudflared 用 QUIC 长连接，扫描类高频流量全部走隧道，源站甚至可以不再暴露公网 443
- 附带收益：切隧道后源站 IP 不再需要 DNS 解析暴露，可以配合防火墙把 80/443 入站全关，只留 SSH
