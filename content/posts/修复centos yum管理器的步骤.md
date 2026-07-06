---
title: 修复centos yum管理器的步骤
abbrlink: 36504
url: /posts/36504.html
date: 2020-08-14 15:15:23
tags:
---

1.查询系统版本
```
cat /etc/os-release
cat /redhat-release
```
2.去centos官方源查找相应软件包
```
http://mirror.centos.org/centos/
```
找到对应版本之后在相应版本的package目录下，如：
```
http://mirror.centos.org/centos/7/os/x86_64/Packages
```
3.使用rpm安装相应包：
```
rpm -ivh http://mirror.centos.org/centos/7/os/x86_64/Packages/yum-3.4.3-167.el7.centos.noarch.rpm
```
安装不上则为缺少依赖，缺少依赖的话会提示依赖，去找相关包即可，有冲突则使用--force选项
```
rpm -ivh http://mirror.centos.org/centos/7/os/x86_64/Packages/yum-3.4.3-167.el7.centos.noarch.rpm --force
```
