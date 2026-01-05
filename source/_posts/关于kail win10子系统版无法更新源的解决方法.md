---
title: 关于kail win10子系统版无法更新源的解决方法
date: 2018-06-01 15:26:20
tags:
---


尝试 apt-get update，结果发现404无法连接

1.第一步判断是DNS解析出了问题.重设DNS：

```bash

nano /etc/resolv.conf
```

添加

```bash

nameserver 8.8.8.8
nameserver 114.114.114.114
```

2.现在尝试

```bash

apt-get update
```

如果提示：The following signatures were invalid: EXPKEYSIG ED444FF07D8D0BF6 Kali Linux Repository <devel@kali.org>

那么意思是说密钥过期，就要重设密钥

于是键入

```bash

apt-key adv --keyserver hkp://keys.gnupg.net --recv-keys 7D8D0BF6
```

重设密钥

但是发现提示：E: gnupg, gnupg2 and gnupg1 do not seem to be installed, but one of them is required for this operation

这下提示gnupg没装，于是需要我们安装：

```bash

apt-get install gnupg
```

但是由于源没更新，索引仍然无法获得，apt无法安装gbupg的包（十分矛盾）

所以我们直接强行获取密钥：

```bash

wget https://http.kali.org/kali/pool/main/k/kali-archive-keyring/kali-archive-keyring_2018.1_all.deb
apt install ./kali-archive-keyring_2018.1_all.deb
```

但是可能会提示 ERROR: The certificate of 'mirrors.neusoft.edu.cn' is not trusted.

这时需要在wget里加参数 --no-check-certificate，也就是键入

```bash

wget https://http.kali.org/kali/pool/main/k/kali-archive-keyring/kali-archive-keyring_2018.1_all.deb --no-check-certificate
```

然后安装

```bash

apt install ./kali-archive-keyring_2018.1_all.deb
```

接下来apt-get update就可行了。


