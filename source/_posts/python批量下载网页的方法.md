---
title: python批量下载网页的方法
date: 2020-02-03 17:07:22
tags:
---

```python

import urllib.request
import ssl
ssl._create_default_https_context = ssl._create_unverified_context #取消验证，用于绕过https
headers = {"User-Agent": "Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.86 Safari/537.36"}# 设置头部用于绕过反爬
for i in (1,43):#假如一本书有1～42章
    print(i)
    for j in range(1,5):#假如每一章有四个小节
        url = 'https://learnXXXX.com/lesson-'+str(i)+'.html/'+str(j)
        req = urllib.request.Request(url,headers=headers)
        webContent = urllib.request.urlopen(req).read()
        f = open('lesson-'+str(i)+'-'+str(j)+'.html', 'wb')
        f.write(webContent)
        print(str(i)+'-'+str(j)+'finish')
        f.close()

```

