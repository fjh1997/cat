---
title: 解决opencore从0.55更新到0.56后出现关机卡住的问题
abbrlink: 29202
url: /posts/29202.html
date: 2020-03-07 20:55:56
tags:
---

很简单使用以下命令重建kextcache即可

```bash
sudo kextcache -i /
```

