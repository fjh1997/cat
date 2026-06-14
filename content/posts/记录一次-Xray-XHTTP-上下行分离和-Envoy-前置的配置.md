---
title: 记录一次因 Nginx 转发 H3 速度慢而改用 Envoy 前置 Xray XHTTP
abbrlink: 20260523
url: /posts/20260523.html
date: 2026-05-23 21:56:28
tags:
  - Xray
  - XHTTP
  - Envoy
  - Nginx
  - 网络
---

## 前言

这次记录的是一套代理服务端配置的调整过程：最开始尝试用 Nginx 做前置转发 Xray XHTTP，但 H3/UDP 下行经过 Nginx 后速度明显偏低；同样的 Xray 直连 H3 诊断入口可以跑满，所以瓶颈基本可以定位在前置层。最后把公网入口改成 Envoy，由 Envoy 接管 TCP/443 的 HTTPS/H2 和 UDP/443 的 HTTP/3，再把 XHTTP 流量转发给本机 Xray，把普通网页流量转发给本机 Nginx 伪装站。

简单对比一下当时的测试结果：

| 方案 | 下行表现 | 说明 |
|------|----------|------|
| XHTTP H2 上行 + H2 下行 | 约 334-339 Mbps | 不走 H3 下行时基本正常 |
| XHTTP H2 上行 + H3 下行，经 Nginx 前置 | 约 7-15 Mbps | 主要瓶颈出现在 Nginx 前置转发 H3 |
| XHTTP H3 直连 Xray 9443 诊断口 | 约 367 Mbps | 说明 Xray 自身和线路并不是主要瓶颈 |
| Caddy 前置 H3 | 约 41 Mbps | 比 Nginx 好，但仍不理想 |
| Envoy 前置 H3 | 作为最终方案 | 用 Envoy 替代 Nginx 做公网 H3 入口 |

为了避免泄露真实信息，本文里的域名、UUID、密码、统计密钥、XHTTP 路径 token 都已经脱敏。直接复制前需要把占位符替换成自己的值。

## 当前架构

调整后的架构里，Nginx 不再作为公网 443 前置，只保留为本机静态伪装站后端；公网 TCP/80、TCP/443、UDP/443 都交给 Envoy。

公网入口：

| 端口 | 协议 | 服务 | 作用 |
|------|------|------|------|
| TCP/80 | HTTP | Envoy | HTTP 跳转 HTTPS，ACME challenge 转发到 Nginx |
| TCP/443 | HTTPS/H2 | Envoy | XHTTP 上行、普通 HTTPS 伪装站 |
| UDP/443 | HTTP/3 | Envoy | XHTTP H3 下行、普通 H3 入口 |
| UDP/9443 | Xray | XHTTP/H3 诊断入口 | 绕过前置的测试入口，不作为常规使用 |

本机后端：

| 地址 | 服务 | 作用 |
|------|------|------|
| 127.0.0.1:10000 | Xray | Envoy 转发过来的 XHTTP 后端 |
| 127.0.0.1:10085 | Xray API | stats、在线用户、限额脚本 |
| 127.0.0.1:18080 | Nginx | 伪装站和 ACME challenge |
| 127.0.0.1:9901 | Envoy admin | Envoy 本机管理接口 |

软件版本：

```bash
Xray 26.3.27
Envoy 1.32.2
nginx 1.31.1
```

## Xray 配置

配置文件路径：

```bash
/usr/local/etc/xray/config.json
```

这里 Xray 只监听本机 XHTTP 后端和 API，TLS/H2/H3 由 Envoy 在公网侧处理。`diag-xhttp-h3-direct` 是直连 H3 诊断入口，用来判断瓶颈是否来自前置代理。

```json
{
  "log": {
    "loglevel": "warning",
    "access": "/var/log/xray/access.log",
    "error": "/var/log/xray/error.log"
  },
  "api": {
    "tag": "api",
    "services": ["HandlerService", "StatsService"]
  },
  "stats": {},
  "policy": {
    "levels": {
      "0": {
        "statsUserUplink": true,
        "statsUserDownlink": true,
        "statsUserOnline": true
      }
    },
    "system": {
      "statsInboundUplink": true,
      "statsInboundDownlink": true,
      "statsOutboundUplink": true,
      "statsOutboundDownlink": true
    }
  },
  "inbounds": [
    {
      "tag": "api-in",
      "listen": "127.0.0.1",
      "port": 10085,
      "protocol": "dokodemo-door",
      "settings": {
        "address": "127.0.0.1"
      }
    },
    {
      "tag": "reality-in",
      "listen": "/dev/shm/xrxh.socket,0666",
      "protocol": "vless",
      "settings": {
        "clients": [
          {
            "id": "<UUID-50G>",
            "flow": "",
            "email": "client-50g@local"
          },
          {
            "id": "<UUID-UNLIMITED-1>",
            "flow": "",
            "email": "client-unlimited@local"
          },
          {
            "id": "<UUID-UNLIMITED-2>",
            "flow": "",
            "email": "client-unlimited2@local"
          }
        ],
        "decryption": "none"
      },
      "streamSettings": {
        "network": "xhttp",
        "xhttpSettings": {
          "mode": "stream-up",
          "path": "/api/v1/<XHTTP-PATH-TOKEN>"
        }
      },
      "sniffing": {
        "enabled": true,
        "destOverride": ["http", "tls", "quic"],
        "routeOnly": true
      }
    },
    {
      "tag": "xhttp-caddy-backend",
      "listen": "127.0.0.1",
      "port": 10000,
      "protocol": "vless",
      "settings": {
        "clients": [
          {
            "id": "<UUID-50G>",
            "flow": "",
            "email": "client-50g@local"
          },
          {
            "id": "<UUID-UNLIMITED-1>",
            "flow": "",
            "email": "client-unlimited@local"
          },
          {
            "id": "<UUID-UNLIMITED-2>",
            "flow": "",
            "email": "client-unlimited2@local"
          }
        ],
        "decryption": "none"
      },
      "streamSettings": {
        "network": "xhttp",
        "xhttpSettings": {
          "mode": "stream-up",
          "path": "/api/v1/<XHTTP-PATH-TOKEN>"
        }
      },
      "sniffing": {
        "enabled": true,
        "destOverride": ["http", "tls", "quic"],
        "routeOnly": true
      }
    },
    {
      "tag": "diag-xhttp-h3-direct",
      "listen": "::",
      "port": 9443,
      "protocol": "vless",
      "settings": {
        "clients": [
          {
            "id": "<UUID-50G>",
            "flow": "",
            "email": "client-50g@local"
          },
          {
            "id": "<UUID-UNLIMITED-1>",
            "flow": "",
            "email": "client-unlimited@local"
          },
          {
            "id": "<UUID-UNLIMITED-2>",
            "flow": "",
            "email": "client-unlimited2@local"
          }
        ],
        "decryption": "none"
      },
      "streamSettings": {
        "network": "xhttp",
        "security": "tls",
        "tlsSettings": {
          "serverName": "<DOWNLOAD-DOMAIN>",
          "alpn": ["h3"],
          "minVersion": "1.2",
          "certificates": [
            {
              "certificateFile": "/usr/local/etc/xray/certs/fullchain.pem",
              "keyFile": "/usr/local/etc/xray/certs/privkey.pem"
            }
          ]
        },
        "xhttpSettings": {
          "mode": "auto",
          "path": "/api/v1/<XHTTP-PATH-TOKEN>"
        }
      },
      "sniffing": {
        "enabled": true,
        "destOverride": ["http", "tls", "quic"],
        "routeOnly": true
      }
    }
  ],
  "outbounds": [
    {
      "protocol": "freedom",
      "tag": "direct"
    },
    {
      "protocol": "blackhole",
      "tag": "blocked"
    }
  ],
  "routing": {
    "domainStrategy": "IPIfNonMatch",
    "rules": [
      {
        "type": "field",
        "inboundTag": ["api-in"],
        "outboundTag": "api"
      },
      {
        "type": "field",
        "ip": ["geoip:cn"],
        "outboundTag": "blocked"
      },
      {
        "type": "field",
        "domain": ["geosite:cn"],
        "outboundTag": "blocked"
      },
      {
        "type": "field",
        "ip": ["geoip:private"],
        "outboundTag": "blocked"
      },
      {
        "type": "field",
        "protocol": ["bittorrent"],
        "outboundTag": "blocked"
      }
    ]
  }
}
```

这里有两个关键点：

1. `policy` 里开启了用户上行、下行和在线统计，所以 `xray api statsquery`、`statsonline`、`statsonlineiplist` 可以正常使用。
2. 路由里拒绝了中国 IP、中国域名、私网地址和 BitTorrent，避免节点被拿来访问国内或跑 BT。

## Envoy 配置

配置文件路径：

```bash
/etc/envoy/envoy.yaml
```

Envoy 的作用是统一接管公网 TCP/80、TCP/443、UDP/443。TCP/443 提供 H2，UDP/443 提供 H3；命中 XHTTP 随机路径的请求转给 Xray，其他请求转给 Nginx 伪装站。

之所以让 Envoy 接管公网入口，是因为 Nginx 做 H3/UDP 前置时下行速度明显掉到十几 Mbps，和 Xray 直连 H3 的三百多 Mbps 不在一个量级。Envoy 的 HTTP/3 支持更适合这个场景，也方便同时保留 HTTP 跳转、ACME challenge 和普通伪装站路由。

```yaml
admin:
  address:
    socket_address:
      address: 127.0.0.1
      port_value: 9901

static_resources:
  listeners:
  - name: listener_http_redirect_v6
    address:
      socket_address:
        address: "::"
        port_value: 80
        ipv4_compat: false
    filter_chains:
    - filters:
      - name: envoy.filters.network.http_connection_manager
        typed_config:
          "@type": type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager
          stat_prefix: http_redirect_v6
          route_config:
            name: http_redirect_route_v6
            virtual_hosts:
            - name: redirect_all_v6
              domains: ["*"]
              routes:
              - match:
                  prefix: "/.well-known/acme-challenge/"
                route:
                  cluster: nginx_site
              - match:
                  prefix: "/"
                redirect:
                  https_redirect: true
          http_filters:
          - name: envoy.filters.http.router
            typed_config:
              "@type": type.googleapis.com/envoy.extensions.filters.http.router.v3.Router

  - name: listener_http_redirect
    address:
      socket_address:
        address: 0.0.0.0
        port_value: 80
    filter_chains:
    - filters:
      - name: envoy.filters.network.http_connection_manager
        typed_config:
          "@type": type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager
          stat_prefix: http_redirect
          route_config:
            name: http_redirect_route
            virtual_hosts:
            - name: redirect_all
              domains: ["*"]
              routes:
              - match:
                  prefix: "/.well-known/acme-challenge/"
                route:
                  cluster: nginx_site
              - match:
                  prefix: "/"
                redirect:
                  https_redirect: true
          http_filters:
          - name: envoy.filters.http.router
            typed_config:
              "@type": type.googleapis.com/envoy.extensions.filters.http.router.v3.Router

  - name: listener_https_tcp
    address:
      socket_address:
        address: 0.0.0.0
        port_value: 443
    filter_chains:
    - filters:
      - name: envoy.filters.network.http_connection_manager
        typed_config:
          "@type": type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager
          codec_type: AUTO
          stat_prefix: https_tcp_ingress
          stream_idle_timeout: 3600s
          request_timeout: 3600s
          common_http_protocol_options:
            idle_timeout: 3600s
          http2_protocol_options:
            max_concurrent_streams: 1024
            initial_stream_window_size: 1048576
            initial_connection_window_size: 16777216
          upgrade_configs:
          - upgrade_type: CONNECT
          route_config:
            name: https_route
            virtual_hosts:
            - name: xhttp_hosts
              domains: ["<UPLOAD-DOMAIN>", "<DOWNLOAD-DOMAIN>"]
              response_headers_to_add:
              - header:
                  key: alt-svc
                  value: h3=":443"; ma=86400
                append_action: OVERWRITE_IF_EXISTS_OR_ADD
              - header:
                  key: x-content-type-options
                  value: nosniff
              - header:
                  key: referrer-policy
                  value: strict-origin-when-cross-origin
              routes:
              - match:
                  prefix: "/api/v1/<XHTTP-PATH-TOKEN>"
                route:
                  cluster: xray_xhttp
                  timeout: 0s
                  idle_timeout: 3600s
                  prefix_rewrite: "/api/v1/<XHTTP-PATH-TOKEN>"
              - match:
                  prefix: "/"
                route:
                  cluster: nginx_site
                  timeout: 60s
            - name: default_host
              domains: ["*"]
              routes:
              - match:
                  prefix: "/"
                route:
                  cluster: nginx_site
                  timeout: 60s
          http_filters:
          - name: envoy.filters.http.router
            typed_config:
              "@type": type.googleapis.com/envoy.extensions.filters.http.router.v3.Router
      transport_socket:
        name: envoy.transport_sockets.tls
        typed_config:
          "@type": type.googleapis.com/envoy.extensions.transport_sockets.tls.v3.DownstreamTlsContext
          common_tls_context:
            alpn_protocols: ["h2", "http/1.1"]
            tls_certificates:
            - certificate_chain:
                filename: /etc/envoy/certs/fullchain.pem
              private_key:
                filename: /etc/envoy/certs/privkey.pem

  - name: listener_https_tcp_v6
    address:
      socket_address:
        address: "::"
        port_value: 443
        ipv4_compat: false
    filter_chains:
    - filters:
      - name: envoy.filters.network.http_connection_manager
        typed_config:
          "@type": type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager
          codec_type: AUTO
          stat_prefix: https_tcp_ingress_v6
          stream_idle_timeout: 3600s
          request_timeout: 3600s
          common_http_protocol_options:
            idle_timeout: 3600s
          http2_protocol_options:
            max_concurrent_streams: 1024
            initial_stream_window_size: 1048576
            initial_connection_window_size: 16777216
          route_config:
            name: https_route_v6
            virtual_hosts:
            - name: xhttp_hosts_v6
              domains: ["<UPLOAD-DOMAIN>", "<DOWNLOAD-DOMAIN>"]
              response_headers_to_add:
              - header:
                  key: alt-svc
                  value: h3=":443"; ma=86400
                append_action: OVERWRITE_IF_EXISTS_OR_ADD
              routes:
              - match:
                  prefix: "/api/v1/<XHTTP-PATH-TOKEN>"
                route:
                  cluster: xray_xhttp
                  timeout: 0s
                  idle_timeout: 3600s
              - match:
                  prefix: "/"
                route:
                  cluster: nginx_site
                  timeout: 60s
            - name: default_host_v6
              domains: ["*"]
              routes:
              - match:
                  prefix: "/"
                route:
                  cluster: nginx_site
                  timeout: 60s
          http_filters:
          - name: envoy.filters.http.router
            typed_config:
              "@type": type.googleapis.com/envoy.extensions.filters.http.router.v3.Router
      transport_socket:
        name: envoy.transport_sockets.tls
        typed_config:
          "@type": type.googleapis.com/envoy.extensions.transport_sockets.tls.v3.DownstreamTlsContext
          common_tls_context:
            alpn_protocols: ["h2", "http/1.1"]
            tls_certificates:
            - certificate_chain:
                filename: /etc/envoy/certs/fullchain.pem
              private_key:
                filename: /etc/envoy/certs/privkey.pem

  - name: listener_https_quic_v6
    address:
      socket_address:
        protocol: UDP
        address: "::"
        port_value: 443
        ipv4_compat: false
    udp_listener_config:
      quic_options: {}
    filter_chains:
    - filters:
      - name: envoy.filters.network.http_connection_manager
        typed_config:
          "@type": type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager
          codec_type: HTTP3
          stat_prefix: https_quic_ingress_v6
          stream_idle_timeout: 3600s
          request_timeout: 3600s
          common_http_protocol_options:
            idle_timeout: 3600s
          http3_protocol_options:
            quic_protocol_options:
              max_concurrent_streams: 1024
              initial_stream_window_size: 1048576
              initial_connection_window_size: 16777216
          route_config:
            name: https_quic_route_v6
            virtual_hosts:
            - name: xhttp_hosts_v6
              domains: ["<UPLOAD-DOMAIN>", "<DOWNLOAD-DOMAIN>"]
              response_headers_to_add:
              - header:
                  key: alt-svc
                  value: h3=":443"; ma=86400
                append_action: OVERWRITE_IF_EXISTS_OR_ADD
              routes:
              - match:
                  prefix: "/api/v1/<XHTTP-PATH-TOKEN>"
                route:
                  cluster: xray_xhttp
                  timeout: 0s
                  idle_timeout: 3600s
              - match:
                  prefix: "/"
                route:
                  cluster: nginx_site
                  timeout: 60s
            - name: default_host_v6
              domains: ["*"]
              routes:
              - match:
                  prefix: "/"
                route:
                  cluster: nginx_site
                  timeout: 60s
          http_filters:
          - name: envoy.filters.http.router
            typed_config:
              "@type": type.googleapis.com/envoy.extensions.filters.http.router.v3.Router
      transport_socket:
        name: envoy.transport_sockets.quic
        typed_config:
          "@type": type.googleapis.com/envoy.extensions.transport_sockets.quic.v3.QuicDownstreamTransport
          downstream_tls_context:
            common_tls_context:
              alpn_protocols: ["h3"]
              tls_certificates:
              - certificate_chain:
                  filename: /etc/envoy/certs/fullchain.pem
                private_key:
                  filename: /etc/envoy/certs/privkey.pem

  - name: listener_https_quic
    address:
      socket_address:
        protocol: UDP
        address: 0.0.0.0
        port_value: 443
    udp_listener_config:
      quic_options: {}
    filter_chains:
    - filters:
      - name: envoy.filters.network.http_connection_manager
        typed_config:
          "@type": type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager
          codec_type: HTTP3
          stat_prefix: https_quic_ingress
          stream_idle_timeout: 3600s
          request_timeout: 3600s
          common_http_protocol_options:
            idle_timeout: 3600s
          http3_protocol_options:
            quic_protocol_options:
              max_concurrent_streams: 1024
              initial_stream_window_size: 1048576
              initial_connection_window_size: 16777216
          route_config:
            name: https_quic_route
            virtual_hosts:
            - name: xhttp_hosts
              domains: ["<UPLOAD-DOMAIN>", "<DOWNLOAD-DOMAIN>"]
              response_headers_to_add:
              - header:
                  key: alt-svc
                  value: h3=":443"; ma=86400
                append_action: OVERWRITE_IF_EXISTS_OR_ADD
              routes:
              - match:
                  prefix: "/api/v1/<XHTTP-PATH-TOKEN>"
                route:
                  cluster: xray_xhttp
                  timeout: 0s
                  idle_timeout: 3600s
              - match:
                  prefix: "/"
                route:
                  cluster: nginx_site
                  timeout: 60s
            - name: default_host
              domains: ["*"]
              routes:
              - match:
                  prefix: "/"
                route:
                  cluster: nginx_site
                  timeout: 60s
          http_filters:
          - name: envoy.filters.http.router
            typed_config:
              "@type": type.googleapis.com/envoy.extensions.filters.http.router.v3.Router
      transport_socket:
        name: envoy.transport_sockets.quic
        typed_config:
          "@type": type.googleapis.com/envoy.extensions.transport_sockets.quic.v3.QuicDownstreamTransport
          downstream_tls_context:
            common_tls_context:
              alpn_protocols: ["h3"]
              tls_certificates:
              - certificate_chain:
                  filename: /etc/envoy/certs/fullchain.pem
                private_key:
                  filename: /etc/envoy/certs/privkey.pem

  clusters:
  - name: xray_xhttp
    connect_timeout: 5s
    type: STATIC
    lb_policy: ROUND_ROBIN
    http2_protocol_options:
      initial_stream_window_size: 1048576
      initial_connection_window_size: 16777216
    load_assignment:
      cluster_name: xray_xhttp
      endpoints:
      - lb_endpoints:
        - endpoint:
            address:
              socket_address:
                address: 127.0.0.1
                port_value: 10000

  - name: nginx_site
    connect_timeout: 5s
    type: STATIC
    lb_policy: ROUND_ROBIN
    load_assignment:
      cluster_name: nginx_site
      endpoints:
      - lb_endpoints:
        - endpoint:
            address:
              socket_address:
                address: 127.0.0.1
                port_value: 18080
```

当时测试过几种前置方式，H3 经过 Nginx Stream 时下行明显掉速，Caddy 有改善但仍不理想，最后切到 Envoy 做 HTTP/3 入口。实际环境里建议保留一个 Xray 直连 H3 诊断端口，用来判断是 Xray 自身、前置代理还是网络路径造成的瓶颈。

## Nginx 伪装站配置

Nginx 不再监听公网 80/443，也不再承担 H3/UDP 前置转发。它只监听本机端口，作为 Envoy 的静态伪装站后端。这样既保留 Nginx 处理静态文件的简单性，又避开了它在这次 H3 转发测试中的速度瓶颈。

主配置：

```nginx
user  nginx;
worker_processes  auto;
worker_rlimit_nofile  200000;

error_log  /var/log/nginx/error.log notice;
pid        /run/nginx.pid;

events {
    worker_connections  8192;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';

    access_log  /var/log/nginx/access.log  main;

    sendfile        on;
    keepalive_timeout  65;
    keepalive_requests 10000;
    client_body_buffer_size 32m;
    client_body_timeout 5m;
    send_timeout 5m;
    proxy_buffering off;

    include /etc/nginx/conf.d/*.conf;
}
```

伪装站配置：

```nginx
server {
    listen 127.0.0.1:18080;
    server_name <UPLOAD-DOMAIN> <DOWNLOAD-DOMAIN>;
    root /var/www/fjh-site;
    index index.html;

    location /.well-known/acme-challenge/ {
        root /var/www/letsencrypt;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

默认站也改成本机监听，避免和 Envoy 的公网端口冲突：

```nginx
server {
    listen 127.0.0.1:18081;
    server_name localhost;

    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
    }

    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
```

## Caddy 备用配置

当前 Caddy 是 disabled，不参与公网入口。机器上仍保留过一版 Caddyfile，方便后续需要时切回 Caddy 前置。这里同样做了脱敏：

```caddyfile
{
    servers {
        protocols h1 h2 h3
    }
}

<UPLOAD-DOMAIN>, <DOWNLOAD-DOMAIN> {
    tls /etc/caddy/certs/fullchain.pem /etc/caddy/certs/privkey.pem
    root * /var/www/fjh-site

    @acme path /.well-known/acme-challenge/*
    handle @acme {
        root * /var/www/letsencrypt
        file_server
    }

    @xhttp path /api/v1/<XHTTP-PATH-TOKEN>*
    reverse_proxy @xhttp h2c://127.0.0.1:10000 {
        header_up Host {host}
        flush_interval -1
    }

    file_server
}
```

## 证书部署 Hook

证书由 Let's Encrypt 生成后，通过 deploy hook 同步到 Envoy、Xray 等服务目录，并重载或重启相关服务。

```sh
#!/usr/bin/env sh
set -eu

install -d -o root -g caddy -m 750 /etc/caddy/certs
install -o root -g caddy -m 640 /etc/letsencrypt/live/<CERT-DOMAIN>/fullchain.pem /etc/caddy/certs/fullchain.pem
install -o root -g caddy -m 640 /etc/letsencrypt/live/<CERT-DOMAIN>/privkey.pem /etc/caddy/certs/privkey.pem

install -d -o root -g envoy -m 750 /etc/envoy/certs
install -o root -g envoy -m 640 /etc/letsencrypt/live/<CERT-DOMAIN>/fullchain.pem /etc/envoy/certs/fullchain.pem
install -o root -g envoy -m 640 /etc/letsencrypt/live/<CERT-DOMAIN>/privkey.pem /etc/envoy/certs/privkey.pem

install -d -o root -g nogroup -m 750 /usr/local/etc/xray/certs
install -o root -g nogroup -m 640 /etc/letsencrypt/live/<CERT-DOMAIN>/fullchain.pem /usr/local/etc/xray/certs/fullchain.pem
install -o root -g nogroup -m 640 /etc/letsencrypt/live/<CERT-DOMAIN>/privkey.pem /usr/local/etc/xray/certs/privkey.pem

if systemctl is-active --quiet nginx; then
    systemctl reload nginx >/dev/null 2>&1 || systemctl restart nginx >/dev/null 2>&1 || true
fi
if systemctl is-active --quiet caddy; then
    systemctl reload caddy >/dev/null 2>&1 || systemctl restart caddy >/dev/null 2>&1 || true
fi
if systemctl is-active --quiet envoy; then
    systemctl reload envoy >/dev/null 2>&1 || systemctl restart envoy >/dev/null 2>&1 || true
fi
systemctl restart xray >/dev/null 2>&1 || true
```

虽然当前入口已经换成 Envoy，hook 里仍然保留了 Caddy 证书同步和 reload 逻辑，是为了以后切换前置时少改一点东西。当前 Caddy 是 disabled，不参与公网入口。

证书私钥文件、证书链文件、历史备份配置和临时诊断客户端配置不适合原样贴到博客里。本文只记录路径和引用方式，不包含任何 PEM 私钥内容。

## systemd 服务

Xray：

```ini
[Unit]
Description=Xray Service
Documentation=https://github.com/xtls
After=network.target nss-lookup.target

[Service]
User=nobody
CapabilityBoundingSet=CAP_NET_ADMIN CAP_NET_BIND_SERVICE
AmbientCapabilities=CAP_NET_ADMIN CAP_NET_BIND_SERVICE
NoNewPrivileges=true
ExecStart=/usr/local/bin/xray run -config /usr/local/etc/xray/config.json
Restart=on-failure
RestartPreventExitStatus=23
LimitNPROC=10000
LimitNOFILE=1000000
RuntimeDirectory=xray
RuntimeDirectoryMode=0755

[Install]
WantedBy=multi-user.target
```

Envoy：

```ini
[Unit]
Description=Envoy Proxy
Documentation=https://www.envoyproxy.io/docs
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=envoy
Group=envoy
ExecStart=/usr/bin/envoy -c /etc/envoy/envoy.yaml --concurrency 1 --log-level warning
Restart=on-failure
RestartSec=3
LimitNOFILE=200000
AmbientCapabilities=CAP_NET_BIND_SERVICE
CapabilityBoundingSet=CAP_NET_BIND_SERVICE
NoNewPrivileges=true

[Install]
WantedBy=multi-user.target
```

## Xray 流量统计和 50GB 限额

Xray 通过 API 统计每个用户的上下行，并用 systemd timer 每分钟运行一次限额脚本。50GB 用户超过累计流量后，通过 Xray API 删除对应用户。

`/etc/systemd/system/xray-traffic-limit.service`：

```ini
[Unit]
Description=Xray per-user traffic quota enforcer
After=xray.service
Requires=xray.service

[Service]
Type=oneshot
ExecStart=/usr/local/bin/xray-traffic-limit.sh
```

`/etc/systemd/system/xray-traffic-limit.timer`：

```ini
[Unit]
Description=Run xray traffic limiter every minute

[Timer]
OnBootSec=1min
OnUnitActiveSec=1min
AccuracySec=10s
Unit=xray-traffic-limit.service

[Install]
WantedBy=timers.target
```

限额脚本：

```bash
#!/usr/bin/env bash
set -euo pipefail

API_ADDR="127.0.0.1:10085"
EMAIL="client-50g@local"
LIMIT_BYTES=$((50 * 1024 * 1024 * 1024))
STATE_DIR="/var/lib/xray-limiter"
DISABLED_FLAG="$STATE_DIR/${EMAIL}.disabled"
CUM_FILE="$STATE_DIR/${EMAIL}.cum"
LOG_TAG="xray-limiter"

mkdir -p "$STATE_DIR"

get_counter() {
  local out
  out=$(xray api statsquery --server="$API_ADDR" -reset -pattern "$1" 2>/dev/null || true)
  [[ -z "$out" ]] && {
    echo 0
    return
  }
  echo "$out" | python3 -c '
import sys, json
try:
    d = json.load(sys.stdin)
    v = 0
    for s in d.get("stat", []):
        v += int(s.get("value", 0) or 0)
    print(v)
except Exception:
    print(0)
'
}

UP=$(get_counter "user>>>${EMAIL}>>>traffic>>>uplink")
DOWN=$(get_counter "user>>>${EMAIL}>>>traffic>>>downlink")
UP=${UP:-0}
DOWN=${DOWN:-0}
DELTA=$((UP + DOWN))

CUM=0
[[ -f "$CUM_FILE" ]] && CUM=$(cat "$CUM_FILE")
CUM=$((CUM + DELTA))
echo "$CUM" > "$CUM_FILE"

logger -t "$LOG_TAG" "email=$EMAIL delta=$DELTA cum=$CUM limit=$LIMIT_BYTES"

if (( CUM >= LIMIT_BYTES )) && [[ ! -f "$DISABLED_FLAG" ]]; then
  logger -t "$LOG_TAG" "limit exceeded, removing user $EMAIL"
  xray api rmu --server="$API_ADDR" -tag=reality-in "$EMAIL" >/dev/null 2>&1 || true
  touch "$DISABLED_FLAG"
fi
```

注意：如果 Xray 的入口 tag 改了，限额脚本里的 `-tag=reality-in` 也要同步修改，否则删除用户不会命中正确 inbound。当前配置里公网 XHTTP 实际走的是 `xhttp-caddy-backend`，如果需要同时封禁所有入口，脚本里应对相关 inbound tag 都执行一次 `rmu`。

## 分享链接模板

XHTTP 上下行分离的分享链接大致如下。这里把关键值都替换成了占位符：

```text
vless://<UUID>@<UPLOAD-DOMAIN>:443?encryption=none&security=tls&sni=<UPLOAD-DOMAIN>&fp=chrome&type=xhttp&host=<UPLOAD-DOMAIN>&path=%2Fapi%2Fv1%2F<XHTTP-PATH-TOKEN>&mode=stream-up&alpn=h2&extra=<URL-ENCODED-EXTRA>#TLS-XHTTP-H2up-H2down
```

`extra` 里可以放 padding、xmux 和 `downloadSettings`。例如下载侧使用另一个域名：

```json
{
  "xPaddingBytes": "100-1000",
  "xmux": {
    "maxConcurrency": "16-32",
    "hMaxRequestTimes": "600-900",
    "hMaxReusableSecs": "1800-3000"
  },
  "downloadSettings": {
    "address": "<DOWNLOAD-DOMAIN>",
    "port": 443,
    "network": "xhttp",
    "security": "tls",
    "tlsSettings": {
      "serverName": "<DOWNLOAD-DOMAIN>",
      "fingerprint": "chrome",
      "alpn": ["h2"]
    },
    "xhttpSettings": {
      "host": "<DOWNLOAD-DOMAIN>",
      "path": "/api/v1/<XHTTP-PATH-TOKEN>",
      "extra": {
        "xPaddingBytes": "100-1000"
      }
    }
  }
}
```

## 验证命令

看服务状态：

```bash
systemctl status xray envoy nginx --no-pager
```

看监听端口：

```bash
ss -lntup | grep -E '(:80|:443|:9443|:10000|:10085|:18080|:9901)'
```

验证 Envoy 配置：

```bash
envoy --mode validate -c /etc/envoy/envoy.yaml
```

看 Envoy H3 统计：

```bash
curl -s http://127.0.0.1:9901/stats | grep http3
```

看 Xray 用户统计：

```bash
xray api statsquery --server=127.0.0.1:10085 -pattern 'user>>>client-unlimited@local>>>traffic>>>'
```

## 结论

这套配置的核心是把入口层和代理层分开：Envoy 负责公网 HTTPS/H2/H3 和伪装站转发，Xray 专注处理 XHTTP，Nginx 只做本机静态站。改成 Envoy 的直接原因，是 Nginx 作为 H3 前置时下行速度明显偏低，而 Xray 直连 H3 诊断口能跑满，说明继续调 Xray 参数意义不大，应该替换前置层。

实际测试中，XHTTP H2/H2 可以跑满链路，H3 下行是否高性能和前置实现关系很大。Nginx Stream 转发 H3 时容易成为瓶颈，Caddy 有改善，Envoy 更适合做这类 HTTP/3 入口。如果遇到速度异常，建议保留一个 Xray 直连 H3 诊断入口，先确认 Xray 自身在当前线路下能否跑满。
