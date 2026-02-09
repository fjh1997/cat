---
title: 记一次openssl同样命令加密结果不同的原因。
abbrlink: 23250
date: 2020-12-01 16:50:11
tags:
---

比如命令使用aes-256-cbc加密“abc”密码为“password”

```bash
echo "abc" | openssl enc -aes-256-cbc -a -nosalt -pass pass:password

```
这个命令的加密结果在苹果系统macos 10.15或者ubuntu 16上为
```
rATlXVKWGrrl7NfjRu685A==
```
在Linux ubuntu 18上结果为
```bash
eytYdlxaT7hPr8JUkHYSZg==
```
原因是不同版本的openssl在加密"abc"的时候将密码"password"转化为密钥时候所用的摘要函数即哈希函数不一样，苹果系统使用的openssl版本为LibreSSL 2.8.3
用的哈希函数为md5，ubuntu16的openssl版本小于1.1，使用的哈希函数为md5。而ubuntu18使用openssl 1.1，使用的哈希函数为sha256，只要openssl版本大于1.1，都使用sha256.
要统一哈希函数就要加-md参数指定哈希函数。
```
echo "abc" | openssl enc -aes-256-cbc -a -nosalt -pass pass:password -md sha256

```
这样macos catalina上的加密结果才能和ubuntu18能保持一致
[参考](https://stackoverflow.com/questions/49034444/differences-in-behavior-for-different-openssl-versions)
