---
title: 实现claude code抓包分析
abbrlink: 54535
url: /posts/54535.html
date: 2026-03-06 19:40:35
tags:
---
需要设置环境变量
```
$env:NODE_TLS_REJECT_UNAUTHORIZED = "0" 
$env:https_proxy = "http://127.0.0.1:8080" 
```
之后启动claude或者插件
Burp里面要设置流式抓包，不然抓到的SSE包不全。
![2026-03-06-20-17-49](/images/2026-03-06-20-17-49.png)
![2026-03-06-20-21-01](/images/2026-03-06-20-21-01.png)