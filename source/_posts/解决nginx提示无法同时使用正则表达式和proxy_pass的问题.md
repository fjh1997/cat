---
title: 解决nginx提示无法同时使用正则表达式和proxy_pass的问题
date: 2019-08-07 15:33:41
tags:
---

一开始想匹配所有level开头的http流量到12000端口，结果报错。说regular expression 和 proxy_pass 无法同时使用。

>  "proxy_pass" cannot have URI part in location given by regular expression, or inside named location, or inside "if" statement, or inside "limit_except" block in /etc/nginx/conf.d/default.conf:35


```
在这里插入代码片
```

```
 location ~/level.+{
                proxy_pass http://127.0.0.1:12000/ #注意这个反斜杠
                ;proxy_set_header Host $host;
                proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }

```
去掉一个反斜杠后就好了，原因国外的大神说的很清楚：
https://serverfault.com/a/649196/677

```
 location ~/level.+{
                proxy_pass http://127.0.0.1:12000 #去掉了
                ;proxy_set_header Host $host;
                proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }

```

