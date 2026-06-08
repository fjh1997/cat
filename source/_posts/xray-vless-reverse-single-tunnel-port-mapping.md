---
title: Xray 新版 VLESS Reverse Proxy 单隧道承载多端口内网穿透
abbrlink: xray-vless-reverse-single-tunnel-port-mapping
date: 2026-06-08 14:20:46
tags:
  - Xray
  - VLESS
  - reality
  - 反向代理
  - 内网穿透
---

## 前言

之前写过一篇 [Xray 反向代理多端口内网穿透配置](/posts/xray-reverse-proxy-enterfirewall.html)，当时使用的是旧版顶层 `reverse.portals` / `reverse.bridges` 写法。那套方案能跑，但每暴露一个服务就要维护一组 portal/bridge tag 和一组 `.internal` 域名，服务数量多了以后配置会变得很长。

这次把同类场景更新为新版 VLESS reverse proxy 写法，并且没有继续采用“一项服务一条反向隧道”的保守迁移方式，而是改成 **一条 VLESS reverse 隧道承载多个公网端口**。

为了避免泄露真实环境，本文中的域名、IP、UUID、服务名、密码、密钥均已脱敏。直接复制配置前需要替换占位符。

## 迁移目标

原来的旧结构大概是这样：

```text
公网 80   -> external-web     -> portal-web     -> bridge-web     -> 127.0.0.1:80
公网 8081 -> external-api     -> portal-api     -> bridge-api     -> 127.0.0.1:8001
公网 8082 -> external-admin   -> portal-admin   -> bridge-admin   -> 127.0.0.1:8002
公网 2222 -> external-ssh     -> portal-ssh     -> bridge-ssh     -> 127.0.0.1:22
```

每一行都要在公网端写 portal，在桥接端写 bridge，还要维护一条用于注册隧道的 `.internal` 域名路由。

更新后的结构：

```text
公网 80
公网 8081
公网 8082
公网 2222
公网 8083
公网 8084
公网 8085
    |
    v
同一个 reverse-out
    |
    v
同一个 reverse-in
    |
    +-- 目标端口 80   -> 127.0.0.1:80
    +-- 目标端口 8081 -> 127.0.0.1:8001
    +-- 目标端口 8082 -> 127.0.0.1:8002
    +-- 目标端口 2222 -> 127.0.0.1:22
```

公网端只负责把外部入口全部转进同一个 `reverse-out`，桥接端再根据请求保留下来的目标端口做二次分流。

## 为什么可以这么做

`dokodemo-door` 入站可以把公网端口上的连接包装成一个带目标地址和目标端口的请求。公网端把这些请求交给 VLESS reverse proxy 后，桥接端的 `reverse-in` 仍然可以基于 `port` 做路由匹配。

所以我们不再需要：

```json
{
  "reverse": {
    "portals": [
      {
        "tag": "portal-web",
        "domain": "tunnel-web.internal"
      }
    ]
  }
}
```

也不再需要桥接端的：

```json
{
  "reverse": {
    "bridges": [
      {
        "tag": "bridge-web",
        "domain": "tunnel-web.internal"
      }
    ]
  }
}
```

新版写法把反向代理关系直接写在 VLESS client/outbound 里。

公网服务器侧：

```json
{
  "id": "<BRIDGE-UUID>",
  "flow": "xtls-rprx-vision",
  "email": "bridge-single@example",
  "reverse": {
    "tag": "reverse-out"
  }
}
```

桥接端侧：

```json
{
  "protocol": "vless",
  "tag": "interconn",
  "settings": {
    "address": "proxy.example.com",
    "port": 443,
    "encryption": "none",
    "id": "<BRIDGE-UUID>",
    "flow": "xtls-rprx-vision",
    "reverse": {
      "tag": "reverse-in"
    }
  }
}
```

注意桥接端 outbound 必须使用 simplified outbound config style，也就是把 `address`、`port`、`id`、`flow`、`reverse` 直接写在 `settings` 下面。不要再写成旧的 `vnext.users` 结构，否则新版 reverse 会报错。

## 公网服务器配置

下面只展示核心配置。假设公网服务器原来已经有一个 VLESS + REALITY + Vision 入站，tag 为 `interconn`。

### VLESS 入站

保留原有普通客户端，同时新增一个专门给桥接端使用的 reverse client：

```json
{
  "tag": "interconn",
  "listen": "0.0.0.0",
  "port": 443,
  "protocol": "vless",
  "settings": {
    "clients": [
      {
        "id": "<NORMAL-CLIENT-UUID>",
        "flow": "xtls-rprx-vision"
      },
      {
        "id": "<BRIDGE-UUID>",
        "flow": "xtls-rprx-vision",
        "email": "bridge-single@example",
        "reverse": {
          "tag": "reverse-out"
        }
      }
    ],
    "decryption": "none"
  },
  "streamSettings": {
    "network": "tcp",
    "security": "reality",
    "realitySettings": {
      "show": false,
      "dest": "www.example.com:443",
      "xver": 0,
      "serverNames": ["www.example.com"],
      "privateKey": "<REALITY-PRIVATE-KEY>",
      "shortIds": ["<REALITY-SHORT-ID>"]
    }
  },
  "sniffing": {
    "enabled": true,
    "destOverride": ["http", "tls", "quic"]
  }
}
```

如果你的入口是普通 TLS，就保留原来的 `tlsSettings`。这里的重点是 `clients` 里新增了带 `reverse.tag` 的桥接客户端。

### 公网入口

公网端仍然用 `dokodemo-door` 暴露多个端口：

```json
[
  {
    "tag": "external-web",
    "listen": "0.0.0.0",
    "port": 80,
    "protocol": "dokodemo-door",
    "settings": {
      "address": "0.0.0.0",
      "port": 80,
      "network": "tcp"
    }
  },
  {
    "tag": "external-api",
    "listen": "0.0.0.0",
    "port": 8081,
    "protocol": "dokodemo-door",
    "settings": {
      "address": "0.0.0.0",
      "port": 8081,
      "network": "tcp"
    }
  },
  {
    "tag": "external-ssh",
    "listen": "0.0.0.0",
    "port": 2222,
    "protocol": "dokodemo-door",
    "settings": {
      "address": "0.0.0.0",
      "port": 2222,
      "network": "tcp"
    }
  }
]
```

`settings.port` 要保留和公网入口一致，因为桥接端后面会靠这个目标端口分流。

### 路由规则

旧配置通常会写成多条：

```json
{
  "inboundTag": ["external-web"],
  "outboundTag": "portal-web"
}
```

新版单隧道可以合并为一条：

```json
{
  "routing": {
    "rules": [
      {
        "type": "field",
        "inboundTag": [
          "external-web",
          "external-api",
          "external-admin",
          "external-ssh",
          "external-service-a",
          "external-service-b"
        ],
        "outboundTag": "reverse-out"
      },
      {
        "type": "field",
        "inboundTag": ["interconn"],
        "outboundTag": "direct"
      }
    ]
  }
}
```

`reverse-out` 不需要出现在 `outbounds` 数组里。它来自 VLESS client 的：

```json
"reverse": {
  "tag": "reverse-out"
}
```

`outbounds` 里保留默认出口即可：

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

## 桥接端配置

桥接端不再需要顶层 `reverse.bridges`。它只需要一个主动连接公网服务器的 VLESS outbound。

### 单 reverse outbound

```json
{
  "protocol": "vless",
  "tag": "interconn",
  "settings": {
    "address": "proxy.example.com",
    "port": 443,
    "encryption": "none",
    "id": "<BRIDGE-UUID>",
    "flow": "xtls-rprx-vision",
    "reverse": {
      "tag": "reverse-in"
    }
  },
  "streamSettings": {
    "network": "tcp",
    "security": "reality",
    "realitySettings": {
      "fingerprint": "chrome",
      "serverName": "www.example.com",
      "publicKey": "<REALITY-PUBLIC-KEY>",
      "shortId": "<REALITY-SHORT-ID>",
      "spiderX": "/"
    }
  }
}
```

如果公网端是普通 TLS，桥接端就改成：

```json
{
  "network": "tcp",
  "security": "tls",
  "tlsSettings": {
    "serverName": "proxy.example.com",
    "fingerprint": "chrome"
  }
}
```

### 本地服务出口

每个本地服务仍然用 `freedom.redirect`：

```json
[
  {
    "tag": "out-web",
    "protocol": "freedom",
    "settings": {
      "redirect": "127.0.0.1:80",
      "finalRules": [
        {
          "action": "allow",
          "network": "tcp",
          "ip": ["127.0.0.1"],
          "port": "80"
        }
      ]
    }
  },
  {
    "tag": "out-api",
    "protocol": "freedom",
    "settings": {
      "redirect": "127.0.0.1:8001",
      "finalRules": [
        {
          "action": "allow",
          "network": "tcp",
          "ip": ["127.0.0.1"],
          "port": "8001"
        }
      ]
    }
  },
  {
    "tag": "out-ssh",
    "protocol": "freedom",
    "settings": {
      "redirect": "127.0.0.1:22",
      "finalRules": [
        {
          "action": "allow",
          "network": "tcp",
          "ip": ["127.0.0.1"],
          "port": "22"
        }
      ]
    }
  }
]
```

`finalRules` 不是必须在所有旧配置里都出现，但新版配置里建议显式写上，只允许 reverse 流量访问需要暴露的本地端口。

### 按目标端口分流

这是单隧道方案的关键：

```json
{
  "routing": {
    "rules": [
      {
        "type": "field",
        "inboundTag": ["reverse-in"],
        "port": "80",
        "outboundTag": "out-web"
      },
      {
        "type": "field",
        "inboundTag": ["reverse-in"],
        "port": "8081",
        "outboundTag": "out-api"
      },
      {
        "type": "field",
        "inboundTag": ["reverse-in"],
        "port": "2222",
        "outboundTag": "out-ssh"
      }
    ]
  }
}
```

这里匹配的是公网 `dokodemo-door` 保留下来的目标端口，不是桥接端本地服务的端口。例如公网 `8081` 最后可以转发到桥接端本机 `127.0.0.1:8001`。

## 验证流程

先在两端验证配置语法：

```bash
xray run -test -config /usr/local/etc/xray/config.json
xray run -test -config /usr/local/etc/xray/bridge-config.json
```

确认通过后再重启：

```bash
systemctl restart xray
systemctl restart xray-bridge
```

公网端看日志，应该能看到外部入口进入同一个 `reverse-out`：

```text
external-web -> reverse-out
external-api -> reverse-out
external-ssh -> reverse-out
```

桥接端看配置摘要，应该没有顶层 `reverse`，并且 VLESS outbound 带有 `reverse`：

```text
has_top_reverse false
reverse_outbounds [('interconn', 'vless', true)]
```

最后逐个测公网端口：

```bash
curl -I http://proxy.example.com/
curl -I http://proxy.example.com:8081/
ssh -p 2222 root@proxy.example.com
```

如果 SSH 能返回 banner，HTTP 服务能返回对应后端响应，说明公网入口、VLESS reverse 隧道和桥接端本地 redirect 都已经打通。

## 回滚

迁移前建议在两端都做备份：

```bash
cp /usr/local/etc/xray/config.json /usr/local/etc/xray/config.json.bak-before-single-vless-reverse
cp /usr/local/etc/xray/bridge-config.json /usr/local/etc/xray/bridge-config.json.bak-before-single-vless-reverse
```

如果切换后发现某个端口异常，可以直接恢复旧配置：

```bash
cp /usr/local/etc/xray/config.json.bak-before-single-vless-reverse /usr/local/etc/xray/config.json
systemctl restart xray
```

桥接端同理：

```bash
cp /usr/local/etc/xray/bridge-config.json.bak-before-single-vless-reverse /usr/local/etc/xray/bridge-config.json
systemctl restart xray-bridge
```

## 取舍

单隧道方案的优点：

- 配置明显更短；
- 不需要维护多组 `.internal` 域名；
- 只需要一个 bridge UUID；
- 多端口入口的流量都走同一条 reverse 通道，管理成本低；
- 从旧 `reverse.portals/bridges` 迁移到新版 VLESS reverse proxy 后，结构更贴近 Xray 当前推荐写法。

缺点也很明确：

- 所有服务共用一条 reverse 通道，故障影响面更大；
- 桥接端依赖目标端口路由，如果公网端 `dokodemo-door` 的目标端口写错，分流会错；
- 迁移时必须两端同时切换，不能只改公网端或只改桥接端。

如果是生产环境，保守做法是一项服务一条 reverse 隧道，出错时只影响单个服务。如果是在维护窗口内追求配置简洁和更少的连接管理开销，单隧道方案更合适。
