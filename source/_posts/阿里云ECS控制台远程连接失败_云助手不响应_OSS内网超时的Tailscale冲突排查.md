---
title: 阿里云 ECS 控制台远程连接失败、云助手不响应、OSS 内网超时——Tailscale 与阿里云 100.x 段冲突排查全过程
date: 2026-06-10 12:40:15
tags:
  - 阿里云
  - Tailscale
  - Headscale
  - iptables
  - OSS
  - 网络排查
---

## 一、现象：从控制台远程连接打不开开始

某天准备登一台跑在杭州地域的阿里云 ECS 改点东西，结果发现三件事同时挂了：

1. **阿里云控制台的「远程连接」（Workbench / VNC）打不开**，点击之后转圈，最后报 "连接失败"；
2. **「云助手」（Cloud Assistant / ECS Run Command）也不响应**，下发任何命令都一直显示「执行中」，永远不返回结果；
3. 业务侧报错：访问 `oss-cn-hangzhou-internal.aliyuncs.com`（OSS 内网域名）超时，对象读写全部 hang 住。

但是奇怪的是：

- **SSH（外网公网 IP）还能正常登录**；
- `ping 8.8.8.8`、`ping baidu.com` 都通；
- 业务里访问外网 API 也都正常。

这就说明 ECS 本身和外网都没问题，**坏的是阿里云自己的内网链路**——控制台远程连接、云助手、OSS 内网域名，全都走阿里云内网 100.x 段。

> 这台机器装了 Tailscale 自建 Headscale，这是个非常重要的伏笔。

## 二、最小化复现：定位到内网域名超时

先确认 OSS 内网到底是 DNS 挂了还是网络挂了：

```bash
$ nslookup oss-cn-hangzhou-internal.aliyuncs.com
Name:   oss-cn-hangzhou-internal.aliyuncs.com
Address: 100.118.28.52
Address: 100.118.28.43
```

DNS 没问题，解析出来两个 100.118.x.x 的地址。

```bash
$ timeout 10 telnet 100.118.28.52 443
Trying 100.118.28.52...
（10 秒之后超时）
```

TCP 不通。再 ping 一下 ECS metadata 服务器（这也是阿里云内部接口）：

```bash
$ ping -c 3 100.100.2.136
3 packets transmitted, 0 received, 100% packet loss
```

也不通。再试一下 metadata HTTP 接口：

```bash
$ curl --connect-timeout 5 http://100.100.100.200/latest/meta-data/region-id
（超时，无输出）
```

也不通。**结论**：凡是阿里云内网 `100.x.x.x` 段，全部访问不到。

到这里就明确了：阿里云控制台远程连接挂掉、云助手不响应，本质上跟 OSS 内网挂掉是**同一个问题**——它们都需要走 ECS 到 100.x 阿里云内网管控面的链路。

## 三、排查防火墙

第一反应是 ufw 或者 iptables 把内网段拦了。

```bash
$ sudo ufw status verbose
Status: inactive
```

ufw 是关的。再看 iptables：

```bash
$ sudo iptables -L -v -n
...
Chain ts-input (1 references)
 pkts bytes target  prot opt in        out  source            destination
    0     0 ACCEPT  0   --  lo         *    100.64.0.1        0.0.0.0/0
    0     0 RETURN  0   --  !tailscale0 *   100.115.92.0/23   0.0.0.0/0
 113K 5983K DROP    0   --  !tailscale0 *   100.64.0.0/10     0.0.0.0/0
 189K   26M ACCEPT  0   --  tailscale0  *   0.0.0.0/0         0.0.0.0/0
...
```

**罪魁祸首找到了**。

`ts-input` 是 Tailscale 自己装的 iptables 链，最关键的是这条：

```
DROP  !tailscale0  100.64.0.0/10  0.0.0.0/0
```

翻译一下：**从不是 `tailscale0` 的网卡进来的包，只要源地址在 `100.64.0.0/10` 这个段里，全部丢掉。**

而这条 DROP 已经累积了 **113000+ 个被丢的包，将近 6MB 流量**——所有访问阿里云内网失败的包，都被这条规则吞了。

## 四、根因：CGNAT 段撞车

为啥 Tailscale 要装这条 DROP？

Tailscale（包括自建 Headscale）默认使用 **`100.64.0.0/10` 这个 CGNAT（运营商级 NAT）地址段**给 tailnet 里的节点分配虚拟 IP。这条 DROP 是 Tailscale 的反伪造防御：从外部网卡进来的包，源 IP 不可能是 tailnet 内部地址，如果有那就是欺骗，丢掉。

**但是！** 阿里云华东 1（杭州）的内网管控面，**也用了 100.x 段**：

| 资源 | 地址段 |
|---|---|
| Tailscale CGNAT（虚拟） | **`100.64.0.0/10`**（即 `100.64.0.0` ～ `100.127.255.255`） |
| 阿里云 ECS metadata | `100.100.100.200`、`100.100.2.136` |
| 阿里云 OSS 内网（杭州） | `100.118.28.0/24` 等 |
| 阿里云云助手/Workbench 回调 | 部分 100.x 段 |

它们**全在 `100.64.0.0/10` 区间内**。

链路是这样的：
1. ECS 发起对 `100.118.28.52`（OSS 内网）的连接，包从 eth0 出去，OSS 服务回包；
2. 回包从 eth0 进来，源 IP 是 `100.118.28.52`；
3. 进了 `INPUT` 链 → `ts-input` 链；
4. 源 IP 在 `100.64.0.0/10` 里 + 进来的网卡不是 `tailscale0` → **DROP**；
5. 应用层看到的就是连接超时。

控制台远程连接打不开、云助手不响应，也是同样的机制：阿里云管控面发到这台 ECS 的回调走的就是这条链路，全被丢了。

## 五、修复方案

### 方案 A：关掉 Tailscale 的 netfilter 接管（推荐）

最干净的办法是让 Tailscale 不要再托管 iptables，让默认 ACCEPT 策略接管。

```bash
$ sudo tailscale set --netfilter-mode=off
Warning: netfilter=off; configure iptables yourself.
```

这条命令告诉 tailscaled：「我不要你的 iptables 规则」。之后 tailscaled 会把它自己加的 `ts-input`、`ts-forward` 等链清掉。

立刻验证：

```bash
$ curl --connect-timeout 5 http://100.100.100.200/latest/meta-data/region-id
cn-hangzhou
```

通了！再试 OSS：

```bash
$ curl -sI http://oss-cn-hangzhou-internal.aliyuncs.com
HTTP/1.1 404 Not Found
Server: AliyunOSS
```

`Server: AliyunOSS` 头就证明已经打到 OSS 了（404 是因为我们没指定 bucket，正常）。同时阿里云控制台的远程连接和云助手也都恢复。

**代价**：失去了 Tailscale 自己装的「外部网卡上源 IP 伪造成 CGNAT 段的包丢掉」这条防御。但是在阿里云 VPC 内部，攻击者要伪造这种源 IP 包到你的 ECS，几乎做不到（VPC 自身的 underlay 会先把它清掉）。所以这个防御**在 VPC 场景下几乎没有实际作用**，关掉是安全的。

而且对 Tailscale 的实际功能没有影响：

- `tailscale0` 接口还在；
- 节点间互相访问还能走；
- 路由还是好的；
- 唯一不工作的就是那条没意义的 DROP。

### 方案 B：保留 netfilter，加豁免规则（不推荐）

如果非要保留 Tailscale 的完整 iptables 规则，可以加一条豁免，让阿里云 OSS 段不被 DROP：

```bash
# 在 ts-input 链的 DROP 规则之前插入豁免
sudo iptables -I ts-input 3 -s 100.118.0.0/16 -j RETURN
```

但是这条规则**不持久**：
- tailscaled 重启时会重建 `ts-input` 链，豁免被冲掉；
- tailscaled 运行时如果对账（比如对端变化、ACL 推送），也可能重建。

要让它持久得写 systemd drop-in：

```bash
sudo mkdir -p /etc/systemd/system/tailscaled.service.d/
sudo tee /etc/systemd/system/tailscaled.service.d/aliyun-exception.conf > /dev/null <<'EOF'
[Service]
ExecStartPost=/bin/sh -c 'sleep 3 && \
  /usr/sbin/iptables -C ts-input -s 100.118.0.0/16 -j RETURN 2>/dev/null || \
  /usr/sbin/iptables -I ts-input 3 -s 100.118.0.0/16 -j RETURN'
EOF
sudo systemctl daemon-reload
sudo systemctl restart tailscaled
```

但是 tailscaled 启动到 ExecStartPost 跑完之间仍然有几秒的窗口期，OSS 会短暂断连。所以一般场景下我还是推荐方案 A。

> 还要注意：上面的豁免段 `100.118.0.0/16` 只覆盖了**杭州**地域的 OSS。如果你的 ECS 在别的地域、或者要访问别的内网服务（如 RDS、Redis 内网），需要查到对应的 100.x 段一起豁免。最稳的查法是直接 `nslookup` 对应内网域名拿 IP，再确定它的 /16 或 /24。

### 方案 C：换 Tailscale 的 IP 段（理论上可行，但复杂）

Headscale 配置文件里可以改 `prefixes.v4`：

```yaml
prefixes:
  v4: 100.64.0.0/10  # 默认
```

如果改成不和阿里云冲突的段（比如自建一个 RFC1918 段），就能彻底避开。但是：

- 所有已注册节点都要重新分配 IP；
- 部分 Tailscale 客户端对非 CGNAT 段的支持有限制；
- 改完 ACL、DNS 都要重写。

对于个人/小团队的 Tailscale 部署，这个改动成本远大于方案 A。**不推荐**。

## 六、为什么阿里云控制台和云助手也会挂

很多人不理解：我自己访问 OSS 失败可以理解，**控制台远程连接、云助手为什么会跟着挂？**

是因为这两个东西的工作机制：

- **云助手**（Cloud Assistant）：ECS 里跑了一个 `AliyunAssistClient` 守护进程，它需要**主动连接阿里云内网的管控接口**拉取要执行的命令。这个接口的接入点同样是 100.x 内网地址，被 DROP 之后客户端连不上服务器，控制台下发的命令就永远是「执行中」。

- **控制台远程连接（Workbench/VNC）**：浏览器走的是阿里云控制台 → 阿里云内网中转 → ECS metadata/agent 通道。中转回来的握手包源 IP 在 100.x 段，被同一条 DROP 吞掉。

所以这是个**典型的「打开了 Tailscale 之后阿里云任何依赖内网管控的功能都坏」综合症**，看到一个症状要联想到一片。

## 七、检查清单

如果你在阿里云上跑了 Tailscale / Headscale 并且遇到下面任何一个症状，都先去看 `iptables -L ts-input -n -v` 那条 DROP 的 pkts 计数：

- [ ] 控制台「远程连接」打不开；
- [ ] 「云助手」下发的命令永远不返回；
- [ ] `curl http://100.100.100.200/latest/meta-data/` 超时（元数据服务）；
- [ ] OSS 内网域名 `oss-*-internal.aliyuncs.com` 超时；
- [ ] RDS、Redis 内网连接超时；
- [ ] SLS 日志服务内网接口超时；
- [ ] 系统初始化时 cloud-init 卡很久；
- [ ] ECS 自动续费、自动伸缩等管控操作异常。

如果 DROP 计数在涨，基本就是这个问题，按方案 A 关掉 netfilter 即可。

## 八、复盘

这个坑挺典型，关键学习点：

1. **DROP 链的统计计数是最快的指纹**。`iptables -L -v -n` 看到一条 DROP 规则上有大量 pkts/bytes 累积，就要立刻怀疑它。
2. **CGNAT 段 100.64.0.0/10 是公开标准段**（RFC 6598），任何使用方都不能假定自己独占。阿里云、Tailscale、容器网络、Kubernetes 的 Cilium 等等都可能占用这个段，多个一起装就容易撞车。
3. **「我看到的症状」和「真正的根因」之间通常隔了几层**。最初看到的是控制台远程连接失败，最后定位到的是 Tailscale 的 iptables 规则——中间隔着 OSS 超时、metadata 超时、DROP 计数三层证据。
4. **本地 SSH 还能用的时候不要急着重启**。这种 iptables 规则问题，重启不会修，只会让你失去能继续排查的入口。

---

排查工具备忘：

```bash
# DNS
nslookup oss-cn-hangzhou-internal.aliyuncs.com

# TCP 探测
timeout 10 telnet <IP> <PORT>

# 看防火墙状态
sudo ufw status verbose
sudo iptables -L -v -n
sudo iptables -L ts-input -v -n   # 直接看 Tailscale 链

# Tailscale 状态
tailscale debug prefs | grep -i netfilter
tailscale status

# Aliyun metadata 自检
curl --connect-timeout 5 http://100.100.100.200/latest/meta-data/region-id

# 关 Tailscale netfilter（修复）
sudo tailscale set --netfilter-mode=off
```
