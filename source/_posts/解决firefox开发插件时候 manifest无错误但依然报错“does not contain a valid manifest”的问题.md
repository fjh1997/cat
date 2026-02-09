---
title: 解决firefox开发插件时候 manifest无错误但依然报错“does not contain a valid manifest”的问题
abbrlink: 38721
date: 2020-07-26 18:44:14
tags:
---

今天开发firefox插件的时候载入插件要么提示损坏要么遇到这个问题
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/8a2337a6f9656aca702edeecc3f79e87.png)
找了半圈manifest的错误，没找出来。
之后打开压缩包的时候，居然发现是这个样子的。
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/1e99b7155ba4a6e302ad8e44dfa3aaba.jpeg)
原则上应该是这样子的：
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/246c0d298b281417425b4bb9bd1f8063.jpeg)
需要注意的是，压缩插件的时候，不要包含顶层目录，直接全选右键压缩即可。
