---
title: python数字与字节互相转换number to bytes，bytes to number
abbrlink: 28369
url: /posts/28369.html
date: 2020-04-16 10:46:22
tags:
---

数字到字节
```python3
>>> n = 80
>>> n.to_bytes(2, 'big')
b'P'
```
字节到数字
```python3
 int.from_bytes(b'P', 'big')
```

