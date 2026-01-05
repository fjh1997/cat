---
title: Premiere Pro文件的压缩类型不受支持的解决办法
date: 2020-05-24 10:36:39
tags:
---

可以使用ffmpeg重新压缩，比如：

```bash
ffmpeg -i origin.mp4  output.mp4
```
之后使用pr打开output即可。
