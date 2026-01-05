---
title: 在burpsuite里面使用http协议form请求的raw格式
date: 2020-07-25 22:24:05
tags:
---

今天试图请求一个raw格式的数据，发现postman给的格式并不正确：

```bash
POST /upload/1.php HTTP/1.1
Host: 52.82.121.166:28437
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW

----WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="a"

system("ls");
----WebKitFormBoundary7MA4YWxkTrZu0gW
```
正确格式应该如下：
```bash
POST /upload/1.php HTTP/1.1
Host: 52.82.121.166:28437
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW

------WebKitFormBoundary7MA4YWxkTrZu0gW #这里多两个-
Content-Disposition: form-data; name="a"

system("ls");
------WebKitFormBoundary7MA4YWxkTrZu0gW--#这里头部尾部均加两个-
```
事实上，这种请求并不方便，使用另一种格式更简单：
也就是x-www-form-urlencoded的形式将form编码中url中。
```bash
POST /upload/1.php HTTP/1.1
Host: 52.82.121.166:28437
Content-Type: application/x-www-form-urlencoded

a=system("ls");
```

