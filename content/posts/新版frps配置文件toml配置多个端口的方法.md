---
title: 新版frps配置文件toml配置多个端口的方法
abbrlink: 62761
url: /posts/62761.html
date: 2025-05-06 14:00:54
tags:
---

根据[官方配置文档](https://github.com/fatedier/frp/blob/6cbb26283c3931766216968975c06e03a58a0941/conf/frpc_full_example.toml)，方法为加入多个[[proxies]],如：

```bash
serverAddr = "X.X.X.X"
serverPort = 7000

[[proxies]]
name = "test-tcp"
type = "tcp"
localIP = "127.0.0.1"
localPort = 22
remotePort = 6000

[[proxies]]
name="tkctf"
type = "tcp"
localIP = "127.0.0.1"
localPort = 80
remotePort = 80
```
警告⚠，frp确实很方便但同时也强烈建议frps配置一下auth-token，不然非常不安全！！！！！！！！！！！！！！！！！

> auth.method = "token"
auth.token = "12345678"



