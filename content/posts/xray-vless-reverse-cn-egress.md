---
title: 使用新版 VLESS Reverse Proxy 实现海外入口回国内出口
abbrlink: xray-vless-reverse-cn-egress
url: /posts/xray-vless-reverse-cn-egress.html
date: 2026-06-08 14:00:17
tags:
  - Xray
  - VLESS
  - XTLS
  - 反向代理
  - 网络
---

## 前言

这篇记录一次比较典型的“回国出口”配置：公网服务器在海外，朋友仍然连接这台海外服务器的 VLESS/XTLS 入口，但访问国内网站时，流量会通过一条反向隧道转回国内机器，再从国内宽带出口访问目标网站。

整体目标是：

- 朋友继续使用公网服务器原来的 443 VLESS 入口；
- 国内机器不需要公网 IP，也不需要在路由器上做端口转发；
- 只把国内域名和国内 IP 转回国内出口，其他流量仍走海外服务器原来的出口；
- 使用 Xray 新版 VLESS reverse proxy 写法，不再使用旧的 `reverse.portals` / `reverse.bridges`。

为了避免泄露真实环境，本文中的域名、UUID、证书路径、用户标识都已经脱敏。直接复制前需要把占位符替换成自己的值。

## 架构

```
朋友客户端
    |
    | VLESS + TLS/REALITY + Vision
    v
海外公网服务器
    |
    | 命中 geosite:cn / geoip:cn
    | 转入 VLESS reverse proxy
    v
国内出口机器
    |
    | freedom 直连
    v
国内网站
```

反向连接由国内出口机器主动发起到海外服务器。海外服务器只需要保留原来的公网 443 入站，国内机器不暴露任何公网端口。

## 新旧写法区别

旧写法通常会在配置顶层写：

```json
{
  "reverse": {
    "portals": [
      {
        "tag": "portal",
        "domain": "tunnel.internal"
      }
    ]
  }
}
```

新版 VLESS reverse proxy 不再依赖顶层 `reverse.portals` / `reverse.bridges`。它把 `reverse` 写进 VLESS client 或 VLESS outbound：

公网服务器侧：

```json
{
  "id": "<BRIDGE-UUID>",
  "flow": "xtls-rprx-vision",
  "email": "cn-bridge@example",
  "reverse": {
    "tag": "cn-reverse-out"
  }
}
```

国内出口机器侧：

```json
{
  "protocol": "vless",
  "settings": {
    "address": "proxy.example.com",
    "port": 443,
    "encryption": "none",
    "id": "<BRIDGE-UUID>",
    "flow": "xtls-rprx-vision",
    "reverse": {
      "tag": "cn-reverse-in"
    }
  }
}
```

公网服务器上的 `cn-reverse-out` 会表现为一个可路由的 outbound；国内出口机器上的 `cn-reverse-in` 会表现为一个可匹配的 inbound。

## 公网服务器配置

下面只展示关键片段。假设公网服务器原来已经有一个 VLESS + TLS/REALITY + Vision 入站，tag 为 `vless-in`。

### 入站新增两个用户

一个用户给国内机器建立反向隧道，一个用户给朋友使用。不要让朋友和自己共用同一个 UUID，否则服务端无法按用户分流。

```json
{
  "tag": "vless-in",
  "listen": "::",
  "port": 443,
  "protocol": "vless",
  "settings": {
    "clients": [
      {
        "id": "<YOUR-OWN-UUID>",
        "flow": "xtls-rprx-vision",
        "email": "self@example"
      },
      {
        "id": "<BRIDGE-UUID>",
        "flow": "xtls-rprx-vision",
        "email": "cn-bridge@example",
        "reverse": {
          "tag": "cn-reverse-out"
        }
      },
      {
        "id": "<FRIEND-UUID>",
        "flow": "xtls-rprx-vision",
        "email": "cnfriend@example"
      }
    ],
    "decryption": "none"
  },
  "streamSettings": {
    "network": "tcp",
    "security": "tls"
  },
  "sniffing": {
    "enabled": true,
    "destOverride": ["http", "tls", "quic"],
    "routeOnly": true
  }
}
```

如果你的入口是 REALITY，就保留原来的 `realitySettings`；如果是普通 TLS 证书，就保留原来的 `tlsSettings`。这里的核心不是 TLS 还是 REALITY，而是新增的 `reverse.tag` 和朋友独立用户。

### 路由规则

只把朋友访问国内域名和国内 IP 的流量转进反向隧道：

```json
{
  "routing": {
    "domainStrategy": "IPIfNonMatch",
    "rules": [
      {
        "type": "field",
        "user": ["cnfriend@example"],
        "domain": ["geosite:cn"],
        "outboundTag": "cn-reverse-out"
      },
      {
        "type": "field",
        "user": ["cnfriend@example"],
        "ip": ["geoip:cn"],
        "outboundTag": "cn-reverse-out"
      }
    ]
  }
}
```

如果原配置里有 `geoip:cn` 或 `geosite:cn` 走 `block` 的规则，上面两条规则要放在 block 规则之前，否则国内流量会先被拦截。

`outbounds` 里仍然要保留一个默认出口，比如：

```json
{
  "outbounds": [
    {
      "tag": "direct",
      "protocol": "freedom"
    },
    {
      "tag": "block",
      "protocol": "blackhole"
    }
  ]
}
```

这样没有命中回国规则的流量不会误入反向隧道。

## 国内出口机器配置

国内机器负责主动连接海外服务器，并把反向进来的流量从本地网络发出去。

```json
{
  "log": {
    "loglevel": "warning"
  },
  "routing": {
    "domainStrategy": "IPIfNonMatch",
    "rules": [
      {
        "type": "field",
        "inboundTag": ["cn-reverse-in"],
        "outboundTag": "cn-home-direct"
      }
    ]
  },
  "outbounds": [
    {
      "protocol": "freedom",
      "tag": "direct"
    },
    {
      "protocol": "freedom",
      "tag": "cn-home-direct",
      "settings": {
        "finalRules": [
          {
            "action": "allow",
            "network": "tcp,udp",
            "ip": ["!geoip:private"]
          }
        ]
      }
    },
    {
      "protocol": "vless",
      "tag": "cn-reverse-bridge",
      "settings": {
        "address": "proxy.example.com",
        "port": 443,
        "encryption": "none",
        "id": "<BRIDGE-UUID>",
        "flow": "xtls-rprx-vision",
        "reverse": {
          "tag": "cn-reverse-in"
        }
      },
      "streamSettings": {
        "network": "tcp",
        "security": "tls",
        "tlsSettings": {
          "serverName": "proxy.example.com",
          "fingerprint": "chrome"
        }
      }
    }
  ]
}
```

这里的 `finalRules` 只允许访问非私网地址，避免朋友通过这条反向隧道访问国内出口机器所在局域网的私有网段。如果你就是要访问内网 NAS、路由器后台等资源，再按需放开具体 IP 和端口，不建议直接放开整个私网。

如果海外入口是 REALITY，国内机器的 `streamSettings` 改成类似下面这样：

```json
{
  "network": "tcp",
  "security": "reality",
  "realitySettings": {
    "serverName": "www.example.com",
    "publicKey": "<REALITY-PUBLIC-KEY>",
    "shortId": "<REALITY-SHORT-ID>",
    "fingerprint": "chrome",
    "spiderX": "/"
  }
}
```

## systemd 用户服务

如果国内机器没有 root 权限，也可以用用户级 systemd 跑 Xray。示例：

```ini
[Unit]
Description=Xray CN reverse exit
After=network-online.target

[Service]
Type=simple
Environment=XRAY_LOCATION_ASSET=%h/.local/share/xray
ExecStart=%h/.local/xray/xray run -config %h/.config/xray-cn-exit/config.json
Restart=on-failure
RestartSec=5
NoNewPrivileges=true

[Install]
WantedBy=default.target
```

启动：

```bash
systemctl --user daemon-reload
systemctl --user enable --now xray-cn-exit.service
systemctl --user status xray-cn-exit.service --no-pager
```

如果要让用户退出登录后仍然保持运行，需要确认系统是否开启了 linger：

```bash
loginctl enable-linger "$USER"
```

这一步通常需要管理员权限。

## 朋友客户端配置

普通 TLS 入口的链接大概是：

```text
vless://<FRIEND-UUID>@proxy.example.com:443?encryption=none&security=tls&sni=proxy.example.com&fp=chrome&type=tcp&flow=xtls-rprx-vision#CN-Return
```

REALITY 入口的链接大概是：

```text
vless://<FRIEND-UUID>@proxy.example.com:443?encryption=none&security=reality&sni=www.example.com&fp=chrome&pbk=<REALITY-PUBLIC-KEY>&sid=<REALITY-SHORT-ID>&type=tcp&flow=xtls-rprx-vision#CN-Return
```

关键是朋友使用独立的 `<FRIEND-UUID>`。服务端通过这个 UUID 对应的 `email` 识别出朋友，然后只把国内目标转进 `cn-reverse-out`。

## 验证

先分别测试配置语法：

```bash
xray run -test -config /usr/local/etc/xray/config.json
xray run -test -config ~/.config/xray-cn-exit/config.json
```

然后重启服务：

```bash
systemctl restart xray
systemctl --user restart xray-cn-exit.service
```

可以临时在本地起一个朋友客户端 SOCKS 入站测试：

```bash
curl -x socks5h://127.0.0.1:18088 -I https://www.baidu.com/
curl -x socks5h://127.0.0.1:18088 https://api.ipify.org
```

期望结果：

- `www.baidu.com` 正常返回；
- 国内出口机器日志里能看到类似 `cn-reverse-in -> cn-home-direct`；
- 非国内目标仍显示海外服务器 IP，说明没有把所有流量都转回国内机器。

## 注意事项

1. 朋友必须使用独立 UUID，不要复用自己的 UUID。
2. 服务器上如果已有 `geoip:cn` / `geosite:cn` 拦截规则，回国规则要放在拦截规则之前。
3. 不建议在公网服务器上额外开放无认证 SOCKS/HTTP 代理端口，朋友直接复用 VLESS 入口即可。
4. 国内出口机器关机、断网或 Xray 服务停止后，朋友的国内分流会不可用。
5. 国内出口侧建议默认禁止访问私网地址，只按需放开具体内网资源。

这套方案的核心是“公网服务器负责入口和分流，国内机器负责主动建立反向隧道和最终出口”。新版 VLESS reverse proxy 把反向代理关系收敛到 VLESS client/outbound 本身，配置比旧的 `reverse.portals` / `reverse.bridges` 更直观，也更适合和现有 XTLS/Vision 入口合并使用。
