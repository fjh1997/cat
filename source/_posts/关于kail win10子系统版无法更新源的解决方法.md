---
title: 关于kail win10子系统版无法更新源的解决方法
date: 2018-06-01 15:26:20
tags:
---


# Kali Linux `apt-get update` 404 及密钥过期解决方法

当尝试执行 `apt-get update` 报错或无法连接时，可以按照以下步骤排查并解决。

## 第一步：检查并重设 DNS 解析

如果发现无法连接到服务器，首先判断是否为 DNS 解析问题。

1. 编辑配置文件：
```bash
nano /etc/resolv.conf

```


2. 添加以下公共 DNS 服务器：
```text
nameserver 8.8.8.8
nameserver 114.114.114.114

```



## 第二步：处理密钥过期问题 (EXPKEYSIG)

在执行 `apt-get update` 时，如果提示如下错误：

> `The following signatures were invalid: EXPKEYSIG ED444FF07D8D0BF6 Kali Linux Repository <devel@kali.org>`

这意味着系统的仓库密钥已过期，需要重新导入。

### 1. 尝试通过 `apt-key` 更新（常规方法）

通常我们会尝试从密钥服务器获取：

```bash
apt-key adv --keyserver hkp://keys.gnupg.net --recv-keys 7D8D0BF6

```

### 2. 解决 `gnupg` 未安装的矛盾

如果执行上述命令提示：

> `E: gnupg, gnupg2 and gnupg1 do not seem to be installed, but one of them is required for this operation`

由于源索引还未更新，此时无法通过 `apt-get install gnupg` 直接安装，会形成死循环。

### 3. 强行下载并安装 Keyring 软件包

为了打破死循环，我们需要直接下载 `.deb` 格式的密钥包进行离线安装：

1. **下载密钥包**（如果提示证书不受信任，需加上 `--no-check-certificate` 参数）：
```bash
wget https://http.kali.org/kali/pool/main/k/kali-archive-keyring/kali-archive-keyring_2018.1_all.deb --no-check-certificate

```


2. **本地安装该包**：
```bash
apt install ./kali-archive-keyring_2018.1_all.deb

```



## 第三步：完成更新

安装完最新的密钥包后，即可正常更新索引并升级系统：

```bash
apt-get update

```



