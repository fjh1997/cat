---
title: SW799刷armbian之后一段时间自动关机的解决方法
abbrlink: 34270
date: 2024-08-29 12:50:39
tags:
---

主要原因是进入了休眠模式：使用以下命令关闭休眠即可：

```bash
sudo systemctl mask sleep.target suspend.target hibernate.target hybrid-sleep.target
```

