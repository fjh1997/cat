---
title: linux下7z或者p7zip 归档管理器乱码的解决方案
date: 2021-11-10 17:27:32
tags:
---

主要是维护团队偷懒，没有时间测试那个老哥正确提交的解码代码。
安装修改版的7z
使用这个：https://github.com/unxed/oemcp
```bash
sudo dpkg -i p7zip-oemcp.deb
```
之后使用`7z x a.zip`即可自动识别解压gbk编码的zip。
之后打开归档管理器发现也正常了。

但是实际测试有些时候也不管用，因为zip里面没有制定oem code，这个时候只能再使用工具`unar`来解压。
unar是macos版本神器The Unarchiver
的linux移植版，很可惜没有图形化界面，

