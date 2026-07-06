---
title: 使用mosdns-x实现DNS分流：白名单域名走DoH代理并自动回退
date: 2026-07-06 16:00:00
tags:
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

### 安装

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

### launchd 服务

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

**白名单热更新**：`auto_reload: true` 让 mosdns 监控白名单文件变化，编辑 `/opt/homebrew/etc/mosdns/whitelist.txt` 后自动生效，无需重启服务。

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

| 文件 | 路径 |
|---|---|
| 主配置 | `/opt/homebrew/etc/mosdns/config.yaml` |
| 白名单 | `/opt/homebrew/etc/mosdns/whitelist.txt` |
| 日志 | `/opt/homebrew/var/log/mosdns.log` |
| launchd | `/Library/LaunchDaemons/com.mosdns.plist` |

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
