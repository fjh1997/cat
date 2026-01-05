---
title: openvas-setup使用代理proxy加速
date: 2019-07-05 22:21:40
tags:
---

openvas在下载文件的时候本质上使用的协议是rsnc协议，因此在设置proxy的时候不能简单设置为http_proxy,而是应该设置成rsnyc_proxy

```bash
export RSYNC_PROXY=127.0.0.1:1080
```

