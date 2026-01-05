---
title: 迁移csdn到hexo
date: 2026-01-05 13:26:46
tags:
---

虽然csdn的markdown编辑器很好用，但是我的部分文章被设置为VIP可见了，背离了我分享知识的初衷，导致我不得不迁移。
使用我的脚本即可：
https://github.com/fjh1997/csdn2md
或者其他人的脚本我感觉也不错：
https://github.com/Kalzncc/Csdn2Local
我的脚本的使用方法是点击编辑文章之后打开开发人员工具在里面把请求包复制到curl
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/8eb7c926505a4208aa9ac662db634e7d.png)
之后使用[curl2python](https://curlconverter.com/)转换即可，用转换后得到的头修改我的脚本。
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/760c6b584de44961b88777ceab7d2a8f.png)

