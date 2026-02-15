---
title: linux shell脚本超时重试
abbrlink: 37493
date: 2020-04-23 11:08:04
tags:
---

```bash
while timeout -k 70 60 bash -c '这里写你的代码' ; [ $? = 124 ]
do 
echo "命令超时正在重试"
sleep 2  # Pause before retry
done
```
这段脚本的意思就是60秒超时之后发送SIGTERM，如果SIGTERM没有使这个命令终止的话那就发送 SIGKILL指令。
$? 表示上个命令的返回状态，124表示超时。
需要注意的是 如果命令前面不加bash -c的话，文件里面也没有#!/bin/bash,那么默认就是以sh来执行的，这可能导致一些shell脚本无法使用。

