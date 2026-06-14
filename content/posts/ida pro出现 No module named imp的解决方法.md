---
title: ida pro出现 No module named imp的解决方法
abbrlink: 7619
url: /posts/7619.html
date: 2024-01-27 23:51:03
tags:
---

原因：python3.12删除了imp这个模块。
解决方法：需要让IDA选择3.12之前的python如3.11版本，因此，从官网安装旧版本python然后运行 IDA 安装目录下的 idapyswitch.exe ，选择使用的正确版本 python 解释器即可。
