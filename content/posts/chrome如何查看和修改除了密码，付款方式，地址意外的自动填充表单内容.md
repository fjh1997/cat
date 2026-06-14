---
title: chrome如何查看和修改除了密码，付款方式，地址意外的自动填充表单内容
abbrlink: 19096
url: /posts/19096.html
date: 2023-03-10 11:42:39
tags:
---

![在这里插入图片描述](/images/f042d27bcd51c6cfaade4676fcd5cabb.png)
这种自动填写的内容似乎无法设置。

软件地址：https://sqlitebrowser.org/dl/
去这里查看地址
https://chromium.googlesource.com/chromium/src/+/master/docs/user_data_dir.md

比如我是windows，则地址为：C:\Users\用户名\AppData\Local\Google\Chrome\User Data\Default\Web Data
之后用软件打开这个sqlite数据库即可：
![在这里插入图片描述](/images/2921dccc4503b36313abbd135e01234f.png)
里面第一个表autofill可以查看和修改。
