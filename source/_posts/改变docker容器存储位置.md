---
title: 改变docker容器存储位置
abbrlink: 22942
date: 2020-04-05 10:43:12
tags:
---

改变docker容器存储位置

```bash
sudo vim /etc/docker/daemon.json
```
在里面添加如下行：
```json
{
  "data-root": "你的位置"
}
```
之后重新启动docker
```bash
sudo systemctl restart docker
