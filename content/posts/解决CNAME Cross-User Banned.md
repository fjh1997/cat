---
title: 解决CNAME Cross-User Banned
abbrlink: 53084
url: /posts/53084.html
date: 2020-05-01 11:24:07
tags:
---

今天配置了cloudflare worker的时候遇到了这个问题
![在这里插入图片描述](/images/4e1ef9487d13bdaf856907623e97cb60.png)
经过仔细排查，发现cloudflare不能反代别的账户的worker，换成自己的worker就行了。
另外在接入第三方 cloudflare partner的时候，如果自己的账户是别人账户的管理员，第三方 cloudflare partner会优先选择自己的账户进行设置，而不是别人的账户，因此我们经常会搞混一些东西。
