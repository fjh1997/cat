---
title: ssh通过代理连接服务器
date: 2021-07-25 17:41:24
tags:
---

```bash
 ssh team306@104.248.38.201 -o "ProxyCommand=nc -X 5 -x 127.0.0.1:7890 %h %p"
```

