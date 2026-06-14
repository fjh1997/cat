---
title: 'Xray反向代理——多端口内网穿透绕过企业级防火墙兼容梯子配置方法'
abbrlink: xray-reverse-proxy-enterfirewall
url: /posts/xray-reverse-proxy-enterfirewall.html
date: 2026-05-05 20:00:00
tags:
  - xray
  - vless
  - reality
  - 反向代理
  - 内网穿透
---

## 背景

在企业内网环境中部署服务时，经常会遇到这样的问题：

- 公司防火墙拦截了frp、rathole等常见内网穿透工具的协议特征
- SSH隧道被DPI（深度包检测）识别并阻断
- 开放的端口有限，仅允许80/443等常见端口出站
- 传统穿透方案需要额外开放端口，增加了暴露面

我们需要一种方案：**既能穿透内网暴露服务，又能伪装成正常HTTPS流量绕过防火墙检测，同时还能作为梯子使用**。

### 方案对比

| 方案 | 性能 | 抗检测 | 备注 |
|------|------|--------|------|
| frp | 高 | 差 | 自定义协议特征明显，容易被DPI识别和阻断 |
| rathole | 高 | 差 | 基于Noise协议，性能优秀但协议指纹已进入黑名单 |
| SSH隧道 | 中 | 中 | 加密流量，但SSH握手特征明显，企业防火墙通常直接拦截 |
| Xray VLESS+REALITY | 高 | 强 | 流量与正常HTTPS访问完全一致，目前无已知检测手段 |

frp和rathole在性能上表现优秀，连接稳定、延迟低，但它们的协议特征已经被主流防火墙和DPI设备收录。在企业环境中，这些工具的连接往往在建立阶段就被拦截。

Xray的VLESS+REALITY+Vision组合完美解决了这个问题。REALITY协议不需要域名和证书，直接复用TLS握手，流量特征与访问正常HTTPS网站完全一致。配合反向代理功能，一个443端口同时承载多服务穿透和梯子。

## 架构说明

```
┌──────────────────┐                    ┌──────────────────┐
│   内网机器(A)     │                    │  公网服务器(B)    │
│                  │   vless+reality    │                  │
│  ┌────────────┐  │ ◄════════════════► │ ┌────────────┐  │
│  │ xray-bridge│  │    port 443        │ │xray-portal │  │
│  └────┬───────┘  │                    │ └────┬───────┘  │
│       │          │                    │      │          │
│  ┌────┴───────┐  │                    │ ┌────┴───────┐  │
│  │ 本地服务    │  │                    │ │ 80/8081/   │  │
│  │ :80        │  │                    │ │ 8082端口    │  │
│  │ :8001      │  │                    │ │ (公网访问)  │  │
│  │ :8002      │  │                    │ └────────────┘  │
│  └────────────┘  │                    │                  │
└──────────────────┘                    └──────────────────┘
```

### 流量走向

1. **内网穿透**：bridge用`.internal`域名连接portal → portal识别为隧道注册 → 外部HTTP流量通过dokodemo-door进入 → portal转发给bridge → bridge转发给本地服务
2. **梯子**：普通客户端用任意域名连接443 → portal识别为普通流量 → freedom直连出站

两种流量共用同一个vless+reality入站，portal通过域名自动区分。

## 关键配置

### 公网服务器（portal端）

`/usr/local/etc/xray/config.json`：

```json
{
  "log": {
    "loglevel": "warning"
  },
  "reverse": {
    "portals": [
      { "tag": "portal-ctfd",        "domain": "tunnel-ctfd.internal" },
      { "tag": "portal-param",       "domain": "tunnel-param.internal" },
      { "tag": "portal-unserialize", "domain": "tunnel-unserialize.internal" }
    ]
  },
  "inbounds": [
    {
      "tag": "interconn",
      "listen": "::",
      "port": 443,
      "protocol": "vless",
      "settings": {
        "clients": [
          { "id": "替换为你的UUID", "flow": "xtls-rprx-vision" }
        ],
        "decryption": "none"
      },
      "streamSettings": {
        "network": "tcp",
        "security": "reality",
        "realitySettings": {
          "show": false,
          "dest": "www.microsoft.com:443",
          "xver": 0,
          "serverNames": ["www.microsoft.com"],
          "privateKey": "替换为xray x25519生成的私钥",
          "shortIds": ["替换为openssl rand -hex 8生成的值"]
        }
      },
      "sniffing": {
        "enabled": true,
        "destOverride": ["http", "tls", "quic"]
      }
    },
    {
      "tag": "external-ctfd",
      "listen": "::",
      "port": 80,
      "protocol": "dokodemo-door",
      "settings": { "address": "0.0.0.0", "port": 80, "network": "tcp" }
    },
    {
      "tag": "external-param",
      "listen": "::",
      "port": 8081,
      "protocol": "dokodemo-door",
      "settings": { "address": "0.0.0.0", "port": 8081, "network": "tcp" }
    },
    {
      "tag": "external-unserialize",
      "listen": "::",
      "port": 8082,
      "protocol": "dokodemo-door",
      "settings": { "address": "0.0.0.0", "port": 8082, "network": "tcp" }
    }
  ],
  "outbounds": [
    { "tag": "direct", "protocol": "freedom" },
    { "tag": "block", "protocol": "blackhole" }
  ],
  "routing": {
    "rules": [
      {
        "comment": "公网 HTTP 流量 → 对应 portal",
        "type": "field",
        "inboundTag": ["external-ctfd"],
        "outboundTag": "portal-ctfd"
      },
      {
        "type": "field",
        "inboundTag": ["external-param"],
        "outboundTag": "portal-param"
      },
      {
        "type": "field",
        "inboundTag": ["external-unserialize"],
        "outboundTag": "portal-unserialize"
      },
      {
        "comment": "bridge 来的隧道注册请求 → 对应 portal",
        "type": "field",
        "inboundTag": ["interconn"],
        "domain": ["full:tunnel-ctfd.internal"],
        "outboundTag": "portal-ctfd"
      },
      {
        "type": "field",
        "inboundTag": ["interconn"],
        "domain": ["full:tunnel-param.internal"],
        "outboundTag": "portal-param"
      },
      {
        "type": "field",
        "inboundTag": ["interconn"],
        "domain": ["full:tunnel-unserialize.internal"],
        "outboundTag": "portal-unserialize"
      },
      {
        "comment": "梯子流量（非 .internal 流量）",
        "type": "field",
        "inboundTag": ["interconn"],
        "outboundTag": "direct"
      }
    ]
  }
}
```

### 内网机器（bridge端）

`/usr/local/etc/xray/bridge-config.json`：

```json
{
  "log": {
    "loglevel": "warning"
  },
  "reverse": {
    "bridges": [
      { "tag": "bridge-ctfd",        "domain": "tunnel-ctfd.internal" },
      { "tag": "bridge-param",       "domain": "tunnel-param.internal" },
      { "tag": "bridge-unserialize", "domain": "tunnel-unserialize.internal" }
    ]
  },
  "outbounds": [
    {
      "tag": "interconn",
      "protocol": "vless",
      "settings": {
        "vnext": [{
          "address": "替换为公网服务器IP",
          "port": 443,
          "users": [{
            "id": "替换为你的UUID",
            "flow": "xtls-rprx-vision",
            "encryption": "none"
          }]
        }]
      },
      "streamSettings": {
        "network": "tcp",
        "security": "reality",
        "realitySettings": {
          "fingerprint": "chrome",
          "serverName": "www.microsoft.com",
          "publicKey": "替换为xray x25519生成的公钥",
          "shortId": "替换为openssl rand -hex 8生成的值",
          "spiderX": "/"
        }
      }
    },
    {
      "tag": "out-ctfd",
      "protocol": "freedom",
      "settings": { "redirect": "127.0.0.1:80" }
    },
    {
      "tag": "out-param",
      "protocol": "freedom",
      "settings": { "redirect": "127.0.0.1:8001" }
    },
    {
      "tag": "out-unserialize",
      "protocol": "freedom",
      "settings": { "redirect": "127.0.0.1:8002" }
    }
  ],
  "routing": {
    "rules": [
      {
        "comment": "bridge 注册握手 → 连接 portal",
        "inboundTag": ["bridge-ctfd"],
        "domain": ["full:tunnel-ctfd.internal"],
        "outboundTag": "interconn"
      },
      {
        "inboundTag": ["bridge-param"],
        "domain": ["full:tunnel-param.internal"],
        "outboundTag": "interconn"
      },
      {
        "inboundTag": ["bridge-unserialize"],
        "domain": ["full:tunnel-unserialize.internal"],
        "outboundTag": "interconn"
      },
      {
        "comment": "portal 转发来的实际流量 → 本地服务",
        "inboundTag": ["bridge-ctfd"],
        "outboundTag": "out-ctfd"
      },
      {
        "inboundTag": ["bridge-param"],
        "outboundTag": "out-param"
      },
      {
        "inboundTag": ["bridge-unserialize"],
        "outboundTag": "out-unserialize"
      }
    ]
  }
}
```

## Systemd 服务配置

### bridge端

```ini
# /etc/systemd/system/xray-bridge.service
[Unit]
Description=Xray Bridge (reverse proxy client)
After=network.target
Wants=network-online.target

[Service]
Type=simple
ExecStart=/usr/local/bin/xray run -config /usr/local/etc/xray/bridge-config.json
Restart=always
RestartSec=5
LimitNOFILE=1048576
User=root

[Install]
WantedBy=multi-user.target
```

### portal端

```ini
# /etc/systemd/system/xray.service
[Unit]
Description=Xray Portal (reverse proxy server)
After=network.target
Wants=network-online.target

[Service]
Type=simple
ExecStart=/usr/local/bin/xray run -config /usr/local/etc/xray/config.json
Restart=always
RestartSec=5
LimitNOFILE=1048576
User=root

[Install]
WantedBy=multi-user.target
```

## 生成 Reality 密钥对

```bash
# 安装 xray
bash -c "$(curl -L https://github.com/XTLS/Xray-install/raw/main/install-release.sh)" @ install

# 生成密钥对（portal端用私钥，bridge端用公钥）
xray x25519

# 生成 shortId（两端保持一致）
openssl rand -hex 8

# 生成 UUID（两端保持一致）
xray uuid
```

## 作为梯子使用

portal的443端口同时支持梯子功能。任何支持VLESS的客户端都可以连接使用。

### 节点链接（可直接导入v2rayN/Clash）

```
vless://替换UUID@替换公网IP:443?encryption=none&flow=xtls-rprx-vision&security=reality&sni=www.microsoft.com&fp=chrome&pbk=替换公钥&sid=替换shortId&spx=%2F&type=tcp#节点名称
```

### Clash配置示例

```yaml
proxies:
  - name: "xray-reality"
    type: vless
    server: 替换公网IP
    port: 443
    uuid: 替换UUID
    network: tcp
    tls: true
    udp: true
    flow: xtls-rprx-vision
    servername: www.microsoft.com
    reality-opts:
      public-key: 替换公钥
      short-id: 替换shortId
    client-fingerprint: chrome
```

## 注意事项

1. **版本一致性**：bridge和portal必须使用相同版本的Xray
2. **不要重复开启Mux**：反向代理底层已使用Mux.cool，不要在interconn outbound上再次开启mux
3. **启动顺序**：建议先启动bridge，再启动portal
4. **bridge端不需要inbound**：reverse.bridges本身就是虚拟inbound，不需要额外配置dokodemo-door
5. **域名路由规则顺序**：`.internal`的规则必须放在`direct`规则之前
6. **穿透服务数量**：每增加一个穿透服务，需要在两端各加一组bridge/portal + 对应的路由规则

## 参考文档

- [Xray 官方反向代理文档](https://xtls.github.io/config/reverse.html)
- [XTLS/Xray-core GitHub](https://github.com/XTLS/Xray-core)
