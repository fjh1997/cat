---
title: ctf自动拼图
date: 2020-07-25 21:54:49
tags:
---

主要用到了montage和gaps

首先把81张图片合成
```bash
montage *.png -tile 9x9 -geometry +0+0 flag.png
```
```

然后gaps就能自动拼图了

```bash
gaps --image=flag.png --size=55 --save
```



