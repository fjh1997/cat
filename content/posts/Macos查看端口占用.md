---
title: Macos查看端口占用
abbrlink: 16100
url: /posts/16100.html
date: 2020-08-28 15:32:22
tags:
---

记得加sudo，另外里面出现的一些端口不是本机的监听端口，而是原创的链接端口，还要过滤LISTEN
```bash
sudo lsof -i:80|grep LISTEN
```

