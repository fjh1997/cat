---
title: Linux记录历史进程的CPU占用量
abbrlink: 59102
url: /posts/59102.html
date: 2020-04-27 21:45:26
tags:
---

```bash
sudo bash #切换到root用户
sudo apt-get install sysstat #安装sysstat
pidstat -u 600 >>/var/log/pidstats.log & disown $! # 后台运行并通过disown使其脱离ssh session控制
```

