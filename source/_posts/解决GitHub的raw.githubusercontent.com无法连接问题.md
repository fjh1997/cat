---
title: 解决GitHub的raw.githubusercontent.com无法连接问题
abbrlink: 56752
date: 2021-01-29 19:41:50
tags:
---

举个例子
原来的资源链接是这样的
https://github.com/sixstars/starctf2021/blob/main/pwn-babypac/main.c
后来的资源链接就可以这样访问
https://cdn.jsdelivr.net/gh/sixstars/starctf2021/pwn-babypac/main.c
或者
https://cdn.jsdelivr.net/gh/sixstars/starctf2021@main/pwn-babypac/main.c
如果是某个commit id就使用
https://cdn.jsdelivr.net/gh/sixstars/starctf2021@559a780f29c9a7efe08835c5ff3d05f57e4389a3/pwn-babypac/main.c
这类

参考：https://blog.csdn.net/neve_give_up_dan/article/details/104817638
