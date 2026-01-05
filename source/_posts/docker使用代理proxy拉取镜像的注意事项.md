---
title: docker使用代理proxy拉取镜像的注意事项
date: 2019-09-14 16:05:05
tags:
---

docker是一个非常方便的容器环境，但docker常常需要拉取大量的镜像，而docker hub的主机又架设在国外，如果使用国内网络访问，将十分的慢，因此我们可以使用国外的代理访问。
然而，问题来了，我们使用以下命令试图让docker走代理，却遇到了问题：

```
export http_proxy=http://127.0.0.1:1080
export https_proxy=http://127.0.0.1:1080
```
经过这个设置之后使用命令`docker pull`，我们发现，docker依旧非常的慢，而使用` curl ipinfo.io`返回的确实是国外的ip，这是怎么回事呢？
原来，docker这个程序只是一个控制台程序，用于attach，真正操作docker的是运行在后台的docker daemon，也就是我们需要通过systemctl start docker来启动docker daemon。所以说即使我们设置了环境变量http_proxy，那么也只是针对前台docker console使用，而真正访问pull镜像的确是后台的daemon，因此，需要设置daemon访问proxy。

```
mkdir -p /etc/systemd/system/docker.service.d
nano /etc/systemd/system/docker.service.d/http-proxy.conf
```
在里面输入

```
[Service]
Environment="HTTP_PROXY=http://USER:PASSWD@SERVER:PORT/"
Environment="HTTPS_PROXY=http://USER:PASSWD@SERVER:PORT/"
```
之后执行以下命令就可以了：

```
systemctl daemon-reload
systemctl restart docker
```

