---
title: openssl一键生成密钥与证书
abbrlink: 24755
url: /posts/24755.html
date: 2020-12-03 21:53:15
tags:
---

```bash
openssl req \
    -new \
    -newkey rsa:4096 \
    -days 365 \
    -nodes \
    -x509 \
    -subj "/C=US/ST=Denial/L=Springfield/O=Dis/CN=www.example.com" \
    -keyout client.key \
    -out client.crt
 ```
