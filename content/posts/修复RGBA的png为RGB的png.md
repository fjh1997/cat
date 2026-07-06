---
title: 修复RGBA的png为RGB的png
abbrlink: 28497
url: /posts/28497.html
date: 2023-11-06 11:12:58
tags:
---

![在这里插入图片描述](/images/402673ef9abd9dbffb7d8556d9d1ede2.png)
修改IHDR里面的color type

![在这里插入图片描述](/images/5715d52c958337861ec94c89c0ffeeea.png)
修改IHDR的crc

![在这里插入图片描述](/images/4e2c2d1f22c03d8a2e85fdfa6abaf773.png)
删除sBit和sRGB两个chunk
