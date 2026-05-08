---
title: Headscale + Tailscale + sing-box for Android 自建组网记录
abbrlink: 51814
date: 2026-05-08 17:10:00
tags:
  - Headscale
  - Tailscale
  - sing-box
  - Android
---

## 背景

最近对网络合规、出口审计和个人流量隔离的要求越来越严格。为了不把个人设备的代理链路挂在办公网络出口上，我把个人访问链路放到了自有设备和自有宽带上：手机只负责接入自己的 tailnet，真正的代理入口放在家里的 Windows 电脑上。

整体思路是：

1. 阿里云 ECS 上部署 Headscale，作为 Tailscale 控制面。
2. 家里的 Windows 电脑加入这个 tailnet，获得 `100.64.0.2`。
3. 家里电脑本地运行 SOCKS5 服务，并监听 `100.64.0.2:10808` 可访问的端口。
4. Android 上用 sing-box for Android 内置的 Tailscale endpoint 登录 Headscale。
5. Android 的 TUN 流量最终转发到 tailnet 里的 `100.64.0.2:10808`。

这样手机侧的链路是：

```text
Android App 流量
  -> sing-box TUN
  -> sing-box 内置 Tailscale endpoint
  -> tailnet 内的 100.64.0.2:10808
  -> 家里电脑上的 SOCKS5
  -> 家里宽带出口
```

注意：这只是个人设备访问个人授权网络的记录。实际使用时要遵守所在单位、学校和网络服务提供方的规则。

## 版本要求

Android 端需要使用支持 sing-box 1.14 新字段的 SFA/sing-box 版本。实测 `sing-box for Android 1.14.0-alpha.21` 以上可用。

低版本如果导入下面的配置，可能会报类似错误：

```text
unknown field accept_search_domain
```

原因是 `accept_search_domain`、`control_http_client`、`dns_mode`、`preferred_by` 等字段属于较新的 sing-box 配置格式。

## Headscale 服务端配置

服务端部署在阿里云 ECS，公网地址、域名和密钥在这里都做了脱敏。

采集到的版本：

```text
headscale version v0.28.0
```

配置文件路径：

```text
/etc/headscale/config.yaml
```

核心配置如下：

```yaml
server_url: https://<HEADSCALE_DOMAIN>:8443
listen_addr: 0.0.0.0:8443
grpc_listen_addr: 127.0.0.1:50443
metrics_listen_addr: 127.0.0.1:9090

database:
  type: sqlite
  sqlite:
    path: /var/lib/headscale/db.sqlite
    write_ahead_log: true

prefixes:
  allocation: sequential
  v4: 100.64.0.0/10
  v6: fd7a:115c:a1e0::/48

dns:
  magic_dns: true
  base_domain: <TAILNET_DNS_SUFFIX>
  override_local_dns: true
  nameservers:
    global:
      - 1.1.1.1
      - 1.0.0.1
      - 2606:4700:4700::1111
      - 2606:4700:4700::1001

derp:
  server:
    enabled: true
    automatically_add_embedded_derp_region: true
    region_id: 999
    region_code: headscale
    region_name: Headscale Embedded DERP
    stun_listen_addr: 0.0.0.0:3478
    private_key_path: <REDACTED>
    verify_clients: true
  urls:
    - https://controlplane.tailscale.com/derpmap/default
  auto_update_enabled: true
  update_frequency: 3h

noise:
  private_key_path: <REDACTED>

tls_cert_path: /path/to/<HEADSCALE_DOMAIN>.cer
tls_key_path: /path/to/<HEADSCALE_DOMAIN>.key
```

systemd 服务使用发行版默认的 `headscale serve`：

```ini
[Service]
User=headscale
Group=headscale
ExecStart=/usr/bin/headscale serve
Restart=always
WorkingDirectory=/var/lib/headscale
StateDirectory=headscale
RuntimeDirectory=headscale
```

节点列表脱敏后大概是这样：

```text
100.64.0.1  headscale-server  linux
100.64.0.2  home-windows-pc   windows
100.64.0.3  other-windows-pc  windows
100.64.0.4  sfa-android       android
```

其中 `100.64.0.2` 是家里的 Windows 电脑，也是 Android 最终要访问的 SOCKS5 节点。

## 家里 Windows 电脑的 Tailscale 配置

本机 Tailscale 版本：

```text
1.96.3
```

关键状态：

```json
{
  "BackendState": "Running",
  "TUN": true,
  "ControlURL": "https://<HEADSCALE_DOMAIN>:8443",
  "TailscaleIPs": [
    "100.64.0.2",
    "fd7a:115c:a1e0::2"
  ],
  "HostName": "home-windows-pc",
  "DNSName": "home-windows-pc.<TAILNET_DNS_SUFFIX>.",
  "OS": "windows"
}
```

偏好配置里比较关键的是：

```json
{
  "ControlURL": "https://<HEADSCALE_DOMAIN>:8443",
  "RouteAll": true,
  "CorpDNS": true,
  "WantRunning": true,
  "LoggedOut": false,
  "NoStatefulFiltering": true,
  "AllowSingleHosts": true
}
```

这台电脑上需要有一个 SOCKS5 服务监听 `10808`。如果只监听 `127.0.0.1:10808`，tailnet 里的手机访问不到；需要确保它监听在 `0.0.0.0:10808`，或者至少监听到 Tailscale 网卡的 `100.64.0.2:10808`，同时 Windows 防火墙允许 tailnet 访问这个端口。

## Android sing-box 配置

Android 端不要同时开官方 Tailscale App 的 VPN。Android 通常只能稳定运行一个 VPN，SFA 的 TUN 已经占用 VPN 入口，所以这里让 sing-box 自己内置一个 Tailscale endpoint。

完整配置如下，`auth_key` 已脱敏：

```json
{
  "log": {
    "level": "info"
  },
  "dns": {
    "servers": [
      {
        "type": "local",
        "tag": "local"
      },
      {
        "type": "https",
        "tag": "remote-dns",
        "server": "1.1.1.1",
        "server_port": 443,
        "path": "/dns-query",
        "tls": {
          "server_name": "cloudflare-dns.com"
        },
        "detour": "proxy"
      },
      {
        "type": "tailscale",
        "tag": "ts-dns",
        "endpoint": "ts-ep",
        "accept_default_resolvers": false,
        "accept_search_domain": true
      }
    ],
    "rules": [
      {
        "domain": [
          "<HEADSCALE_DOMAIN>"
        ],
        "action": "route",
        "server": "local"
      },
      {
        "preferred_by": [
          "ts-dns"
        ],
        "action": "route",
        "server": "ts-dns"
      }
    ],
    "final": "remote-dns",
    "strategy": "prefer_ipv4",
    "timeout": "10s"
  },
  "endpoints": [
    {
      "type": "tailscale",
      "tag": "ts-ep",
      "state_directory": "tailscale-home",
      "auth_key": "<REDACTED_AUTH_KEY>",
      "control_url": "https://<HEADSCALE_DOMAIN>:8443",
      "control_http_client": {
        "domain_resolver": "local"
      },
      "hostname": "sfa-android",
      "accept_routes": true,
      "udp_timeout": "5m"
    }
  ],
  "inbounds": [
    {
      "type": "tun",
      "tag": "tun-in",
      "address": [
        "172.19.0.1/30",
        "fdfe:dcba:9876::1/126"
      ],
      "auto_route": true,
      "strict_route": true,
      "dns_mode": "hijack",
      "stack": "mixed",
      "endpoint_independent_nat": true
    }
  ],
  "outbounds": [
    {
      "type": "socks",
      "tag": "proxy",
      "server": "100.64.0.2",
      "server_port": 10808,
      "version": "5",
      "network": [
        "tcp",
        "udp"
      ],
      "detour": "ts-ep"
    },
    {
      "type": "direct",
      "tag": "direct"
    },
    {
      "type": "block",
      "tag": "block"
    }
  ],
  "route": {
    "rules": [
      {
        "port": 53,
        "action": "hijack-dns"
      },
      {
        "action": "sniff"
      },
      {
        "preferred_by": [
          "ts-ep"
        ],
        "action": "route",
        "outbound": "ts-ep"
      },
      {
        "ip_is_private": true,
        "action": "route",
        "outbound": "direct"
      }
    ],
    "final": "proxy",
    "auto_detect_interface": true,
    "default_domain_resolver": "local"
  }
}
```

关键点是这个出站：

```json
{
  "type": "socks",
  "tag": "proxy",
  "server": "100.64.0.2",
  "server_port": 10808,
  "detour": "ts-ep"
}
```

`detour: ts-ep` 表示连接 SOCKS5 服务本身时先走 Tailscale endpoint。没有这个字段，Android 的普通网络无法直接访问 `100.64.0.2`。

## 启动顺序

1. Headscale 服务端先启动，确认 `server_url` 能访问。
2. 家里 Windows 电脑登录 Headscale，确认拿到 `100.64.0.2`。
3. 家里电脑启动 SOCKS5 服务，确认 `100.64.0.2:10808` 可访问。
4. Android 导入 sing-box 配置，启动 SFA。
5. 在 Headscale 上查看 `sfa-android` 节点是否在线。

常用检查命令：

```bash
headscale nodes list
```

Windows 上检查：

```powershell
tailscale status
tailscale debug prefs
```

sing-box 配置可以先用本地源码检查：

```powershell
go run -tags "with_gvisor,with_tailscale" ./cmd/sing-box check -c .\sing-box-android-tailscale.json
```

## 排错

如果 Android 报 `unknown field accept_search_domain`，升级 SFA/sing-box 到 `1.14.0-alpha.21` 以上。

如果 Android 能登录 Headscale 但不能访问 `100.64.0.2:10808`，先检查家里电脑上的 SOCKS5 是否监听在 Tailscale 可访问的地址上，再检查 Windows 防火墙。

如果 Headscale 控制面域名解析失败，确保 Android 配置里的 `control_http_client.domain_resolver` 指向 `local`，避免控制面解析也走还没建立起来的代理链路。

如果 DNS 查询异常，确认 `dns_mode` 是 `hijack`，并且 `route.rules` 里有 `port: 53` 的 `hijack-dns` 规则。

## 脱敏清单

这篇文章里隐藏了这些内容：

1. Headscale 服务器公网 IP。
2. Headscale 域名。
3. SSH 密码。
4. Tailscale auth key。
5. 节点公钥、机器密钥和私钥路径。
6. 证书文件真实路径。

真实环境里不要把 auth key、SSH 密码、私钥、节点 key 写进博客仓库。首次注册成功后，也建议把一次性 auth key 作废。
