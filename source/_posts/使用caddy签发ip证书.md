---
title: 使用caddy签发ip证书
abbrlink: 52007
date: 2026-02-18 11:56:45
tags:
---
使用SSL证书可以确保网页的安全性，但是往往需要一个域名才能签发，之前能白嫖ip6.arpa域名，但是根据Ballot SC-086v3已经下架了。目前我们如果有公网ip可以用lets encrypt签发证书，时间只有几天，但使用caddy可以自动续期，配置文件如下：
```
# HTTPS site (existing)
123.123.123.123 {
	tls {
		issuer acme {
			dir https://acme-v02.api.letsencrypt.org/directory
			profile shortlived
		}
	}



	handle {
		reverse_proxy localhost:80
	}
}


```