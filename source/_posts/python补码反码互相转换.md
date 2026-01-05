---
title: python补码反码互相转换
date: 2020-05-03 20:08:32
tags:
---

反码:
以八位为例
```python
def one(x):
	return x^0xff#逐位取反如果是16bit就0xffff，32bit就0xffffffff
```
反码:
以八位为例
```python
def two(x):
	return (x^0xff)+1#逐位取反后加1如果是16bit就0xffff，32bit就0xffffffff
```

