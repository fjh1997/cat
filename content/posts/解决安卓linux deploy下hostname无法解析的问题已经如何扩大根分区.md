---
title: 解决安卓linux deploy下hostname无法解析的问题已经如何扩大根分区
abbrlink: 45181
url: /posts/45181.html
date: 2021-02-18 14:51:35
tags:
---

最后发现居然是存储空间不够的问题，需要扩大linux deploy的空间。

```bash
e2fsck -f ${EXTERNAL_STORAGE}/linux.img
resize2fs ${EXTERNAL_STORAGE}/linux.img
```
参考：https://github.com/meefik/linuxdeploy/issues/395
