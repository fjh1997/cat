---
title: CTF jpg thumbnail隐写
abbrlink: 61704
date: 2020-04-28 11:46:24
tags:
---

需要安装exiftool,将flag.jpg 隐藏到challenge.jpg的tag.jpg 隐藏到challenge.jpg的thumbnail中

```bash
exiftool -b -ThumbnailImage flag.jpg > thumbnail.jpg

```

```bash
exiftool "-ThumbnailImage<=thumbnail.jpg" challenge.jpg

```
之后使用XnView这种软件的时候就可以看到图片是柯南，而它的略缩图却是flag![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/56cbd4923295b6c341812e9a1581b02e.jpeg)


