---
title: go install 出现 cannot use path@version syntax in GOPATH mode 的解决办法
abbrlink: 12517
date: 2022-11-19 17:57:02
tags:
---

原因：golang版本太旧，不支持这个语法，往往是使用apt安装golang的结果
解决方法：去官网上下载golang ，版本至少1.19以后。

```bash
apt remove golang-go
wget https://go.dev/dl/go1.19.3.linux-amd64.tar.gz
rm -rf /usr/local/go && tar -C /usr/local -xzf go1.19.3.linux-amd64.tar.gz
```

