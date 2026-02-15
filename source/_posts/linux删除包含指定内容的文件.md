---
title: linux删除包含指定内容的文件
abbrlink: 21212
date: 2020-07-19 20:20:34
tags:
---

```bash
grep -lrIZ '273B246D7975726C3D27'. | xargs -0 rm -f --
#删除当前目录以及递归目录下内容中有273B246D7975726C3D27的文件
find ./ -name *bak*|xargs rm -rf
#删除当前目录以及递归目录下名字中含有bak的文件
grep -lrIZ wp-config.bak.php. |xargs -0 dirname| xargs rm -rf
#删除文件名为wp-config.bak.php的文件的所在目录。
```

