---
title: 使用nginx搭建文件下载服务器
abbrlink: 56895
date: 2019-08-06 17:09:19
tags:
---

```
server {
        listen 8081;
        root /challenges; #文件目录
        location / {
        autoindex on;
        types{} #这个一定要加，可以使得http请求头里的类型不是MIME type，这样就是直接下载图片而不是显示图片。
        }
}

```

