---
title: Docker删除不必要的容器或者镜像
abbrlink: 13129
url: /posts/13129.html
date: 2020-08-11 15:54:49
tags:
---

删除exit的容器
```bash
sudo docker ps --filter "status=exited"  | awk '{print $1}'|sudo xargs --no-run-if-empty docker rm
```
删除所有tag为\<none\>的镜像
```bash
sudo docker rmi $(sudo docker images -f "dangling=true" -q)
```

