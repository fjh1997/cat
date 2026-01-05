---
title: 关机时候“A stop job is running for User Manager for UID 1000“ 的调试方法
date: 2021-12-11 16:33:19
tags:
---

```bash
systemctl enable --now debug-shell.service
```
然后在出现这个问题的时候按` Alt-F9`进入shell。

使用` systemctl  list-job` 找出还在运行的systemd服务然后使用`systemd status xxxx` 查看服务运行情况。



参考：https://github.com/systemd/systemd/issues/12262
