---
title: 解决老旧操作系统无法ssh密钥登录的问题
abbrlink: 14474
date: 2024-08-17 00:34:14
tags:
---

今天在一个老旧服务器上配置ssh免密钥登录，一开始登录不上，提示
> Unable to negotiate with 10.10.2.3 port 22: no matching key exchange method found. Their offer: diffie-hellman-group-exchange-sha1,diffie-hellman-group14-sha1,diffie-hellman-group1-sha1

然后加了参数可以登录，但是死活需要我用密码登录。如果我只用ssh登录不加参数会提示密码需要输入，设置了authorized权限也没用。


使用-vvvv调试发现

> debug1: Will attempt key: /Users/jihanfu/.ssh/id_rsa RSA SHA256:gFUuZDPoALpi8+UZ3DYV/NMxsG3rlQbSr8puSYwdkXQ
debug1: Will attempt key: /Users/jihanfu/.ssh/id_ecdsa

也就是说id_rsa没被识别，联想到上次里面的sha1，会不会是算法不支持呢？然后网上一查sha1确实被淘汰了，那么我把参数里面加上即可：

```bash
ssh -vvvv  -oKexAlgorithms=+diffie-hellman-group1-sha1 -oHostKeyAlgorithms=+ssh-rsa -o PubKeyAcceptedAlgorithms=+ssh-rsa
```
参考：https://ikarus.sg/rsa-is-not-dead/

