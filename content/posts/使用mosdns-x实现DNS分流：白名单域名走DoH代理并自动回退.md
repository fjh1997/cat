---
title: 使用mosdns-x实现DNS分流：白名单域名走DoH代理并自动回退
abbrlink: 2026070601
url: /posts/2026070601.html
date: 2026-07-06 16:00:00
tags:
  - DNS
  - mosdns
  - macOS
  - Windows
---
## 背景

打开超星学习通（chaoxing.com）时页面一直加载缓慢，浏览器开发者工具发现 `static.wisweb.com` 和 `p2.cldisk.com` 两个资源域名 DNS 解析失败（ERR_NAME_NOT_RESOLVED）。排查发现系统 DNS 指向了本地 dnscrypt-proxy（127.0.0.1:53），而 dnscrypt-proxy 配置了通过 xray 代理访问 Cloudflare DoH，形成了一条脆弱的依赖链。

## 问题根因

原来的 DNS 解析链路：

```
系统 DNS (127.0.0.1:53)
  → dnscrypt-proxy
    → http_proxy (127.0.0.1:10808)
      → xray 代理
        → Cloudflare DoH (cloudflare-dns.com)
```

这条链路存在多个单点故障：

1. **dnscrypt-proxy 依赖 xray 代理**：`http_proxy = 'http://127.0.0.1:10808'` 配置导致所有 DNS 查询都要经过 xray
2. **xray 节点域名需要 DNS 解析**：xray 连接的节点域名 `d4.fjh1997.top` 本身需要 DNS 查询，存在循环依赖风险
3. **重启即崩**：dnscrypt-proxy 重启后缓存清空，需要重新 bootstrap 连接 Cloudflare，但如果 xray 代理此时未就绪，整个 DNS 系统瘫痪

## 需求

- **默认域名**走普通 DNS（快速、稳定、不依赖代理）
- **白名单域名**（Google、GitHub 等）走 Cloudflare DoH，通过 xray SOCKS5 代理加密访问
- DoH 或代理故障时**自动回退**到普通 DNS
- 不能有循环依赖

## 方案选型

### 尝试 dnsproxy（AdGuard）

dnsproxy 支持按域名分流上游，但有两个致命问题：

1. **不支持 HTTP 代理**：`HTTPS_PROXY` 环境变量无效，直连 Cloudflare 被 GFW reset
2. **不支持 `http://` scheme**作为 DoH 上游：日志报 `unsupported url scheme: http`

尝试用 Python 写中继脚本弥补，但需要自签证书、额外维护一个进程，方案过于复杂。

### 最终选择：mosdns-x

[mosdns-x](https://github.com/pmkol/mosdns-x) 是一个灵活的 DNS 路由器，原生支持：

- `fast_forward` 插件的 `socks5` 参数 — 直接通过 SOCKS5 代理转发 DoH 请求
- `dial_addr` 参数 — 直接指定 DoH 服务器 IP，避免 DNS 循环依赖
- `primary`/`secondary` + `fast_fallback` — 优雅的故障回退机制
- `data_provider` — 白名单域名文件，支持 `auto_reload` 热更新

## 部署

### macOS 安装

```bash
# 通过代理下载（直连 GitHub 可能慢）
curl -sL --proxy socks5://127.0.0.1:10808 \
  -o /tmp/mosdns.zip \
  "https://github.com/pmkol/mosdns-x/releases/download/v26.05.25/mosdns-darwin-arm64.zip"

unzip /tmp/mosdns.zip -d /tmp/mosdns-bin
cp /tmp/mosdns-bin/mosdns /opt/homebrew/bin/mosdns
chmod +x /opt/homebrew/bin/mosdns

mosdns version
# version: v4.6.0, build time: 26.05.25
```

### 白名单域名文件

创建 `/opt/homebrew/etc/mosdns/whitelist.txt`，每行一个域名，后缀匹配（`google.com` 会匹配 `www.google.com` 等）：

```
# Google
google.com
googleapis.com
gstatic.com
youtube.com
ytimg.com
ggpht.com
googlevideo.com

# GitHub
github.com
githubusercontent.com
githubassets.com
github.io

# 社交媒体
twitter.com
x.com
twimg.com
t.co
facebook.com
instagram.com
whatsapp.com

# AI
openai.com
anthropic.com
claude.ai
chatgpt.com

# 其他
wikipedia.org
wikimedia.org
cloudflare.com
microsoft.com
apple.com
```

### mosdns 配置文件

创建 `/opt/homebrew/etc/mosdns/config.yaml`：

```yaml
log:
  file: ""
  level: error

data_providers:
  - tag: doh_whitelist
    file: /opt/homebrew/etc/mosdns/whitelist.txt
    auto_reload: true

plugins:
  # 缓存
  - tag: cache
    type: cache
    args:
      size: 4096
      lazy_cache_ttl: 86400

  # 默认上游: AliDNS 普通 DNS (快、稳、不依赖代理)
  - tag: forward_default
    type: fast_forward
    args:
      upstream:
        - addr: "223.5.5.5"
          trusted: true
        - addr: "223.6.6.6"
          trusted: true

  # DoH 上游: Cloudflare DoH 经 xray SOCKS5 代理
  # dial_addr 直接指定 IP，无需 DNS 解析，避免循环依赖
  - tag: forward_doh
    type: fast_forward
    args:
      upstream:
        - addr: "https://cloudflare-dns.com/dns-query"
          dial_addr: "1.1.1.1:443"
          socks5: "127.0.0.1:10808"
          trusted: true
          idle_timeout: 30

  # 白名单域名匹配
  - tag: query_is_whitelist
    type: query_matcher
    args:
      domain:
        - "provider:doh_whitelist"

  # 白名单处理: DoH 优先，超时回退到普通 DNS
  - tag: whitelist_handler
    type: sequence
    args:
      exec:
        - primary:
            - forward_doh
          secondary:
            - forward_default
          fast_fallback: 300
          always_standby: false

  # 主流水线
  - tag: main_sequence
    type: sequence
    args:
      exec:
        - cache
        - if: query_is_whitelist
          exec:
            - whitelist_handler
            - _return
        - forward_default

servers:
  - exec: main_sequence
    timeout: 5
    listeners:
      - protocol: udp
        addr: "127.0.0.1:53"
      - protocol: tcp
        addr: "127.0.0.1:53"
```

### macOS launchd 服务

创建 `/Library/LaunchDaemons/com.mosdns.plist`：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.mosdns</string>
    <key>ProgramArguments</key>
    <array>
        <string>/opt/homebrew/bin/mosdns</string>
        <string>start</string>
        <string>-c</string>
        <string>/opt/homebrew/etc/mosdns/config.yaml</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardErrorPath</key>
    <string>/opt/homebrew/var/log/mosdns.log</string>
</dict>
</plist>
```

加载服务并切换系统 DNS：

```bash
sudo launchctl load /Library/LaunchDaemons/com.mosdns.plist
networksetup -setdnsservers Wi-Fi 127.0.0.1
sudo dscacheutil -flushcache && sudo killall -HUP mDNSResponder
```

### Windows 部署为系统服务

Windows 不建议把 `mosdns.exe` 直接放进注册表启动项或交互式计划任务。`mosdns.exe` 是控制台程序，这样做在登录时会弹出黑框；如果同时配置了多个启动入口，还会出现多个实例争用 53 端口、任务返回 `0xFFFFFFFF` 等问题。

mosdns-x 自带 Windows 服务管理功能，正确做法是将其注册为系统服务。以下步骤已在 Windows 11、mosdns-x `v4.6.0`（build `26.05.25`）上验证。

#### 相关脚本下载

本文配套脚本已放在站点静态目录，可直接下载：

| 文件 | 说明 |
|------|------|
| [healthcheck.ps1](/files/mosdns/healthcheck.ps1) | UDP 默认上游健康探测：失败才 `Restart-Service mosdns` |
| [install-healthcheck.ps1](/files/mosdns/install-healthcheck.ps1) | 管理员一键安装探测脚本 + 计划任务 `mosdns-udp-health` |
| [config.windows.yaml](/files/mosdns/config.windows.yaml) | Windows 示例配置（默认 UDP 多上游 + 白名单 DoH） |
| [whitelist.txt](/files/mosdns/whitelist.txt) | 示例白名单 |
| [README.md](/files/mosdns/README.md) | 简要说明 |

也可从 GitHub 仓库路径获取：[`static/files/mosdns/`](https://github.com/fjh1997/cat/tree/main/static/files/mosdns)

一键下载健康检查到 `C:\mosdns` 并注册任务（管理员 PowerShell）：

```powershell
New-Item -ItemType Directory -Path C:\mosdns -Force | Out-Null
Invoke-WebRequest https://cat.fjh1997.top/files/mosdns/healthcheck.ps1 -OutFile C:\mosdns\healthcheck.ps1
Invoke-WebRequest https://cat.fjh1997.top/files/mosdns/install-healthcheck.ps1 -OutFile C:\mosdns\install-healthcheck.ps1
powershell -ExecutionPolicy Bypass -File C:\mosdns\install-healthcheck.ps1
```


#### 1. 准备目录和文件

从 [mosdns-x Releases](https://github.com/pmkol/mosdns-x/releases) 下载 `mosdns-windows-amd64.zip`，解压后整理成：

```text
C:\mosdns\
├── mosdns.exe
├── config.yaml              # 示例: /files/mosdns/config.windows.yaml
├── whitelist.txt            # 示例: /files/mosdns/whitelist.txt
├── healthcheck.ps1          # 可选 UDP 健康检查
└── install-healthcheck.ps1
```

示例配置与白名单可直接下载：

- [config.windows.yaml](/files/mosdns/config.windows.yaml) → 保存为 `C:\mosdns\config.yaml`（按需改 SOCKS 端口/上游）
- [whitelist.txt](/files/mosdns/whitelist.txt) → `C:\mosdns\whitelist.txt`

Windows 版配置逻辑与前文一致，只需要把文件路径换成 Windows 路径。YAML 中推荐使用正斜杠，避免反斜杠转义：

```yaml
log:
  file: "C:/mosdns/mosdns.log"
  level: error

data_providers:
  - tag: doh_whitelist
    file: "C:/mosdns/whitelist.txt"
    auto_reload: true
```

中间的 `plugins` 配置直接沿用前文。`servers` 可以同时监听 IPv4 和 IPv6 回环地址：

```yaml
servers:
  - exec: main_sequence
    timeout: 5
    listeners:
      - protocol: udp
        addr: "127.0.0.1:53"
      - protocol: tcp
        addr: "127.0.0.1:53"
      - protocol: udp
        addr: "[::1]:53"
      - protocol: tcp
        addr: "[::1]:53"
```

先在管理员 PowerShell 中检查版本和配置能否启动：

```powershell
Set-Location C:\mosdns
.\mosdns.exe version
.\mosdns.exe start -c C:\mosdns\config.yaml
```

看到四个监听器正常启动后按 `Ctrl+C` 退出，再安装服务。

#### 2. 安装并启动 Windows 服务

仍在管理员 PowerShell 中执行：

```powershell
Set-Location C:\mosdns

# 注册为开机自动启动的 Windows 服务
.\mosdns.exe service install -d C:\mosdns -c C:\mosdns\config.yaml

# install 只负责注册，不会立即启动
.\mosdns.exe service start

# 查看 mosdns 自带的服务状态
.\mosdns.exe service status

# 也可以通过 Windows SCM 查看
Get-Service -Name mosdns
```

正常情况下，服务应显示为 `Running`，启动类型为 `Automatic`，登录桌面时也不会出现控制台窗口。

> 该服务功能由 mosdns-x 内置的 `service` 子命令提供。官方说明其底层基于 `kardianos/service`，Windows 已实测可用，但仍建议安装后检查服务、监听端口和实际 DNS 解析结果。

#### 3. 将 Windows DNS 指向本机

先查看正在使用的物理网卡名称：

```powershell
Get-NetAdapter | Where-Object Status -eq Up
```

假设网卡名为 `以太网`，执行：

```powershell
netsh interface ipv4 set dnsservers name="以太网" static 127.0.0.1 primary validate=no
netsh interface ipv6 set dnsservers name="以太网" static ::1 primary validate=no
Clear-DnsClientCache
```

如果使用 Wi-Fi，把命令中的 `以太网` 换成实际接口名。只需要修改当前上网的物理网卡，不要批量修改 WSL、Hyper-V、VMware、Tailscale、WireGuard 等虚拟网卡。

#### 4. 验证服务、端口和解析

```powershell
# 服务必须处于 Running
Get-Service -Name mosdns

# 127.0.0.1 和 ::1 的 TCP/UDP 53 应归同一个 mosdns PID
Get-NetUDPEndpoint -LocalPort 53
Get-NetTCPConnection -LocalPort 53 -State Listen

# 测试普通 DNS 和白名单域名
Resolve-DnsName baidu.com -Server 127.0.0.1 -DnsOnly
Resolve-DnsName google.com -Server 127.0.0.1 -DnsOnly
Resolve-DnsName github.com -Server 127.0.0.1 -DnsOnly
```

mosdns 服务会早于用户登录启动，而 xray 的 `127.0.0.1:10808` 可能稍后才就绪。此时白名单查询暂时走 `secondary` 普通 DNS 回退是预期行为；xray 启动后，后续查询会自动恢复使用 Cloudflare DoH。

#### 5. 避免重复启动

确认服务运行正常后，不要再保留同名计划任务或注册表启动项。可以先检查：

```powershell
Get-ScheduledTask -TaskName mosdns -ErrorAction SilentlyContinue
Get-ItemProperty HKCU:\Software\Microsoft\Windows\CurrentVersion\Run `
  -Name mosdns -ErrorAction SilentlyContinue
```

如果这些入口是以前手动创建的，可以删除：

```powershell
Unregister-ScheduledTask -TaskName mosdns -Confirm:$false -ErrorAction SilentlyContinue
Remove-ItemProperty HKCU:\Software\Microsoft\Windows\CurrentVersion\Run `
  -Name mosdns -ErrorAction SilentlyContinue
```

服务日常管理命令：

```powershell
Set-Location C:\mosdns
.\mosdns.exe service restart
.\mosdns.exe service stop
.\mosdns.exe service start

# 确实不再使用时才卸载
.\mosdns.exe service stop
.\mosdns.exe service uninstall
```

### Windows 服务账户：为何默认是 LocalSystem，而不是用户态

`mosdns.exe service install` 注册的服务默认以 **LocalSystem（SYSTEM）** 运行。这不是“必须最高权限才安全”，而是工程取舍：

| 方式 | 优点 | 缺点 |
|------|------|------|
| **LocalSystem 服务**（当前方案） | 开机即可解析 DNS，**不依赖用户登录**；绑定 `127.0.0.1:53` 更省事；崩溃可由 SCM 自动拉起 | 权限面大；出问题时排查要区分 Session 0 / 用户会话 |
| **当前用户交互式启动** | 权限更小，更接近“最小权限” | 未登录时没有 DNS；注销即停；黑框/多实例问题又会回来 |
| **专用低权限账户 + 服务** | 介于两者之间，相对更安全 | 要单独建账户、授目录权限、处理 53 端口权限，维护成本高 |

**结论：**

- 作为**系统 DNS 转发器**，更合理的模型是 **服务 + 开机自启**，而不是“用户登录后才起的用户态进程”。
- 若坚持更安全：可改为专用本地账户跑服务，而不是直接用交互用户会话；**不必**为了“用户态更安全”放弃 Windows 服务模型。
- 本文实测：UDP 上游假死与“是不是 LocalSystem”**无直接关系**——同一 LocalSystem 下 **SYSTEM 裸发 UDP 到阿里 DNS 完全正常**，问题在 **mosdns 进程内复用的 UDP 连接**。

### Windows 默认上游建议多路兜底

生产环境建议默认上游不要只写两个 AliDNS，可加上路由器与备用公共 DNS，降低单一上游抖动：

```yaml
  - tag: forward_default
    type: fast_forward
    args:
      upstream:
        - addr: "192.168.1.254"   # 按实际网关修改；没有可删
          trusted: true
        - addr: "223.5.5.5"
          trusted: true
        - addr: "223.6.6.6"
          trusted: true
        - addr: "119.29.29.29"
          trusted: true
```

日志排查时临时把 `log.level` 调到 `info`，稳定后再改回 `error`。

### Windows 踩坑：UDP 上游“假死”（2026-07 补充）

#### 现象

- 服务显示 `Running`，`127.0.0.1:53` 也在听。
- **白名单域名**（Google/GitHub，走 DoH + SOCKS5）仍正常。
- **默认域名**（baidu、超星静态资源等，走明文 UDP 上游）全部超时：`context deadline exceeded`。
- 用户态用同一份 `config.yaml` 起 mosdns（监听高端口）则 **UDP 上游完全正常**。

容易误判成：

1. 上游 DNS 挂了  
2. 和 ICS（SharedAccess）“抢上游端口”  
3. LocalSystem 不能发 UDP  

下面三条都能排除。

#### 根因（已用抓包 + 管理员实验验证）

`fast_forward` 会对上游做 **连接复用**（进程内可见长期 connected 的 UDP：`0.0.0.0:xxxxx → 223.5.5.5:53` 等）。

在 Windows 上，服务跑久之后（休眠唤醒、网卡切换、Hyper-V/WSL 虚拟网卡抖动等），这些 **connected UDP 可能进入“假死”**：

| 检查项 | 假死进程 | 说明 |
|--------|----------|------|
| `netstat` | 仍显示连着 `223.5.5.5:53` | 套接字对象还在 |
| Wireshark/dumpcap 抓以太网 `udp and host 223.5.5.5` | **0 包** | **根本没把查询打到网卡** |
| mosdns 日志 | 有客户端 query，最终 `deadline exceeded` | 请求进了 mosdns，上游侧空转 |
| `Restart-Service mosdns` | 新 PID、新临时端口，UDP 立刻恢复 | 清掉假死连接即可 |

进一步对照：

```text
SYSTEM 进程 raw UDP → 223.5.5.5     ✅ 正常
假死中的 mosdns 服务（旧 PID）      ❌ 线上 0 包
重启后的 mosdns 服务（新 PID）      ✅ UDP 恢复
ICS (SharedAccess) 保持 Running     ✅ 不必为修 UDP 去关 ICS
```

**因此：**

1. **不是上游服务器坏了。**  
2. **不是 ICS 和 `223.5.5.5` 抢端口**——上游在远端，客户端用的是临时源端口。  
3. ICS 占 `0.0.0.0:53` 主要影响的是“谁当本机 DNS **服务端**监听 53”；你的 mosdns 监听 `127.0.0.1:53` 可以并存。  
4. 若本机还开 **WSL2**，微软文档要求 **ICS/SharedAccess 参与 HNS/DNS**，**不要为了本机 DNS 长期禁用 ICS**。

#### 快速恢复（坚持 UDP 上游时）

管理员 PowerShell：

```powershell
Restart-Service mosdns
Resolve-DnsName www.baidu.com -Server 127.0.0.1 -DnsOnly -Type A
Resolve-DnsName static.wisweb.com -Server 127.0.0.1 -DnsOnly -Type A
```

#### 健康检查：失败才重启（推荐）

官方 `idle_timeout` 只作用于 TCP/DoT/DoH 等，**不会**回收明文 UDP 连接。要在坚持 UDP 上游的前提下自愈，使用配套脚本（[healthcheck.ps1](/files/mosdns/healthcheck.ps1) / [install-healthcheck.ps1](/files/mosdns/install-healthcheck.ps1)）：

1. 周期性用 `127.0.0.1` 解析非白名单域名（走默认 UDP 上游）。
2. **仅失败时** `Restart-Service mosdns`，正常时零打扰。
3. 以 SYSTEM 计划任务运行（默认每 3 分钟）。

管理员一键安装：

```powershell
# 已下载到 C:\mosdns 时：
powershell -ExecutionPolicy Bypass -File C:\mosdns\install-healthcheck.ps1
```

或直接从站点拉取（见上文「相关脚本下载」）。

> 这与早期“暴力 watchdog 杀进程”不同：**仅探测失败才重启**，正常时不碰服务。

日志默认写到 `C:\mosdns\healthcheck.log`。

#### 排查清单（给未来的自己）

```powershell
# 1) 服务与监听
Get-Service mosdns
Get-NetUDPEndpoint -LocalPort 53 | Format-Table LocalAddress,OwningProcess

# 2) 是否在复用“假死”上游 socket（长期固定远程 53 很可疑）
$pid = (Get-CimInstance Win32_Service -Filter "Name='mosdns'").ProcessId
netstat -ano -p UDP | findstr $pid

# 3) 分流是否正常：默认域 vs 白名单
Resolve-DnsName www.baidu.com  -Server 127.0.0.1 -DnsOnly -Type A
Resolve-DnsName www.google.com -Server 127.0.0.1 -DnsOnly -Type A

# 4) 对照：本机直连上游是否正常（排除运营商/上游故障）
Resolve-DnsName www.baidu.com -Server 223.5.5.5 -DnsOnly -Type A

# 5) 仍异常：抓包看服务查询时有没有 192.168.x.x → 223.5.5.5 的 DNS
#    有请求无应答 → 上游/中间设备；完全无请求 → 假死连接或进程未真正 send
```

配置务必改 **服务实际加载的路径** `C:\mosdns\config.yaml`（`sc qc mosdns` 可见），不要改用户目录里另一份拷贝。

## 架构说明

```
系统 DNS: 127.0.0.1 → mosdns (mosdns-x v4.6.0)
  │
  ├── 默认域名 → AliDNS 普通 DNS (223.5.5.5)
  │     快速、稳定、不依赖代理
  │     chaoxing.com, wisweb.com, cldisk.com 等
  │
  └── 白名单域名 → Cloudflare DoH (1.1.1.1:443)
        ├── 经 xray SOCKS5 代理 (127.0.0.1:10808)
        ├── dial_addr 直连 IP，无需 DNS 解析
        ├── 300ms 超时自动回退到 AliDNS
        │
        google.com, github.com, twitter.com 等
```

### 关键设计

**避免循环依赖**：`dial_addr: "1.1.1.1:443"` 直接指定 Cloudflare 的 IP，mosdns 连接 DoH 服务器时不需要先解析域名。xray 的 SOCKS5 入口也是 `127.0.0.1:10808`，本地直连无需 DNS。

**自动回退**：`fast_fallback: 300` 表示 DoH 请求超过 300ms 未响应时，自动发起普通 DNS 查询作为备选。`always_standby: false` 表示不预先发起备选查询，仅在超时后才回退，减少不必要的查询。

**白名单热更新**：`auto_reload: true` 让 mosdns 监控白名单文件变化。macOS 编辑 `/opt/homebrew/etc/mosdns/whitelist.txt`，Windows 编辑 `C:\mosdns\whitelist.txt`，保存后都会自动生效，无需重启服务。

**Windows 服务模型**：用内置 `service` 跑 LocalSystem，保证未登录也可解析；安全上若要收紧，优先考虑专用服务账户，而不是退回用户态启动项。

**Windows UDP 自愈**：明文 UDP 上游可能因连接复用假死；保留 UDP 策略时，用“探测失败才重启”的健康检查，而不是改成全站 DoH 或关掉 ICS。

## 验证

```bash
# 默认域名 - 走 AliDNS
nslookup www.chaoxing.com
# Name: bistatic-mh.aichaoxing.com
# Address: 140.210.88.45

nslookup static.wisweb.com
# Name: k1.gslb.ksyuncdn.com
# Address: 115.231.33.4

# 白名单域名 - 走 Cloudflare DoH via xray
nslookup google.com
# Name: google.com
# Address: 142.251.210.142

nslookup github.com
# Name: github.com
# Address: 20.205.243.166
```

## 清理旧服务

```bash
# 禁用 dnscrypt-proxy
sudo mv /Library/LaunchDaemons/homebrew.mxcl.dnscrypt-proxy.plist \
       /Library/LaunchDaemons/homebrew.mxcl.dnscrypt-proxy.plist.disabled

# 禁用 dnsproxy 和 doh-relay
sudo mv /Library/LaunchDaemons/com.dnsproxy.plist \
       /Library/LaunchDaemons/com.dnsproxy.plist.disabled
sudo mv /Library/LaunchDaemons/com.doh-relay.plist \
       /Library/LaunchDaemons/com.doh-relay.plist.disabled
```

## 配置文件位置

| 文件 | macOS | Windows |
|---|---|---|
| 主配置 | `/opt/homebrew/etc/mosdns/config.yaml` | `C:\mosdns\config.yaml` |
| 白名单 | `/opt/homebrew/etc/mosdns/whitelist.txt` | `C:\mosdns\whitelist.txt` |
| 日志 | `/opt/homebrew/var/log/mosdns.log` | `C:\mosdns\mosdns.log` |
| 自启动方式 | `/Library/LaunchDaemons/com.mosdns.plist` | 内置 `mosdns` Windows 服务 |
| UDP 健康检查（可选） | — | 计划任务 `mosdns-udp-health` + `C:\mosdns\healthcheck.ps1` |

重启命令：

```bash
sudo launchctl unload /Library/LaunchDaemons/com.mosdns.plist
sudo launchctl load /Library/LaunchDaemons/com.mosdns.plist
```

## 总结

从"超星加载慢"到最终方案，经历了：

1. **诊断**：浏览器 DevTools 发现 DNS 解析失败
2. **根因**：dnscrypt-proxy 的 `http_proxy` 配置造成脆弱的代理依赖链
3. **尝试 dnsproxy**：不支持 HTTP 代理，不支持 `http://` scheme，方案失败
4. **尝试 Python 中继**：可行但过于复杂，需要额外维护进程和自签证书
5. **mosdns-x**：原生 `socks5` 参数 + `dial_addr` + `fast_fallback`，完美满足所有需求

mosdns-x 的插件化设计非常灵活，`fast_forward` 插件的 `socks5` 参数直接解决了"DoH 走代理"的核心需求，`dial_addr` 避免了 DNS 循环依赖，`primary`/`secondary` + `fast_fallback` 提供了优雅的故障回退。配合 `data_provider` 的 `auto_reload`，白名单维护也非常方便。

Windows 上后续补充的经验：

1. **用系统服务，不要用户态启动项**——为的是开机可用，不是“SYSTEM 更安全”。
2. **默认路径坚持 UDP 时，要防连接假死**——表现为白名单还行、国内域全挂；重启服务即愈；可用健康检查自愈。
3. **需要 WSL2 时不要长期关 ICS**——ICS 占 `0.0.0.0:53` 与 `127.0.0.1:53` 可并存；UDP 假死不是“和上游抢 53 端口”。
