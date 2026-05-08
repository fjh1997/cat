---
title: Headscale + Tailscale + sing-box for Android：利用家宽打洞实现公司环境安全“科学上网”
abbrlink: 51814
date: 2026-05-08 17:10:00
tags:
  - Headscale
  - Tailscale
  - sing-box
  - Android
---

## 背景

在当前的工作环境下，公司对网络合规和出口流量审计的要求日益严苛。办公网络不仅严查各类 VPN 协议，还会对所有通往境外的连接记录进行深度审计。为了在满足个人上网需求的同时，彻底避免将个人设备的代理链路暴露在办公网络出口上，我构建了一套基于“组网即代理”的方案。

核心思路是利用家里的宽带作为唯一的“科学上网”出口，而办公环境下的手机仅作为一个纯粹的内网接入点，通过自建的 Tailscale 网络连接回自家的电脑进行“打洞”。具体设计动机如下：

1. **规避办公网审计**：通过将真正的代理入口放在家里的 Windows 电脑上，手机在办公网环境下只产生与国内服务器（阿里云）或家宽公网 IP 的通信。所有对境外的访问流量均被封装在隧道内部，并最终在家宽出口解封，从而确保办公网出口没有任何境外 IP 的访问记录。
2. **阿里云控制面（Headscale）**：为了实现稳定且不经过境外的控制平面，我在国内的**阿里云 ECS** 上部署了 **Headscale**（Tailscale 的开源替代方案）。需要注意，阿里云在这里仅作为**控制面（Control Plane）**负责节点发现和 NAT 穿透握手，**并不负责数据中转**。流量最终是通过 P2P 打洞直连到家里的，这样既保证了低延迟，也避免了阿里云因流量中转产生高昂的带宽费用。
3. **完全物理隔离**：本方案实现了个人访问链路与办公网络的物理级隔离。办公网出口看到的只是前往阿里云的合规 HTTPS 流量，真正的互联网访问逻辑完全托管在自有设备和自有宽带上。

### 整体思路

1. **阿里云 ECS** 上部署 **Headscale**，作为 Tailscale 控制面（仅负责握手，记得关闭或不使用 DERP 中转，以节省阿里云流量）。
2. **家里的 Windows 电脑** 加入这个 tailnet，作为代理网关，获得内网 IP `100.64.0.2`。
3. **家里电脑** 本地运行 SOCKS5 服务（如 Clash/v2ray），并监听 `100.64.0.2:10808` 端口。
4. **Android 手机** 使用 sing-box for Android，通过内置的 Tailscale endpoint 登录 Headscale。
5. **手机流量路由**：Android 的 TUN 流量通过 Tailscale 隧道转发到家里的 `100.64.0.2:10808`。

这样手机侧的链路是：

```text
Android App 流量
  -> sing-box TUN
  -> sing-box 内置 Tailscale endpoint (通过阿里云 Headscale 握手)
  -> tailnet 内内的 100.64.0.2:10808 (加密隧道)
  -> 家里电脑上的 SOCKS5 代理
  -> 家里宽带出口 (真正的境外访问发生在这里)
```

注意：这只是个人设备访问个人授权网络的记录。实际使用时要严格遵守所在单位、学校和网络服务提供方的安全合规准则。

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
    enabled: false # 强烈建议关闭 DERP 服务，防止流量走阿里云中转产生巨额费用，确保家宽 P2P 直连
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

Windows 端不需要额外写复杂配置，核心就是在 Headscale 服务端生成一个预授权 key，然后在 Windows 上用这个 key 加入自建控制面。

在 Headscale 服务端生成 Windows 节点使用的 key：

```bash
headscale preauthkeys create --user 1 --expiration 24h
```

如果希望这个 key 可以给多台设备重复使用，可以加 `--reusable`：

```bash
headscale preauthkeys create --user 1 --expiration 24h --reusable
```

然后在家里的 Windows 电脑上执行：

```powershell
tailscale up --login-server https://<HEADSCALE_DOMAIN>:8443 --auth-key <WINDOWS_AUTH_KEY> --hostname home-windows-pc --accept-dns=true --accept-routes=true
```

这台电脑上需要有一个 SOCKS5 服务监听 `10808`。如果只监听 `127.0.0.1:10808`，tailnet 里的手机访问不到；需要确保它监听在 `0.0.0.0:10808`，或者至少监听到 Tailscale 网卡的 `100.64.0.2:10808`，同时 Windows 防火墙允许 tailnet 访问这个端口。

## Android sing-box 配置

Android 端不要同时开官方 Tailscale App 的 VPN。Android 通常只能稳定运行一个 VPN，SFA 的 TUN 已经占用 VPN 入口，所以这里让 sing-box 自己内置一个 Tailscale endpoint。

Android 端同样需要先在 Headscale 服务端生成一个 auth key：

```bash
headscale preauthkeys create --user 1 --expiration 24h
```

如果只是给手机导入一次配置，建议使用一次性 key，不加 `--reusable`。生成出来的 key 填到下面 sing-box 配置的 `auth_key` 字段里。

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
