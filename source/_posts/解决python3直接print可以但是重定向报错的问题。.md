---
title: 解决python3直接print可以但是重定向报错的问题。
abbrlink: 61488
date: 2024-01-17 11:59:58
tags:
---

比如如下代码:

```python
#test.py
print(b'\xc2\xa0'.decode())
```

```bash
python test.py
```
没关系
```bash
python test.py > ques.txt
```
会报错
> UnicodeEncodeError: 'gbk' codec can't encode character '\xa0' in position 0: illegal multibyte sequence

之后尝试设置环境变量
```powershell
$env:PYTHONIOENCODING="UTF-8"
```
解决问题了，猜测是终端直接走stdio，编码会使用utf-8,但是重定向之后会使用GBK编码的原因。从而导致某些UTF-8的字符在GBK里面无法编码。
也可以直接设置：

```bash
import sys
sys.stdout.reconfigure(encoding='utf-8')
```

或者使用

```python
python -X utf8 test.py
```
参考python3官方文档的说法可以解释这一现象：

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/eea47f1a3207033ef25bfadb3833aebc.png)


https://docs.python.org/3/library/sys.html

使用一下代码进行测试，会发现重定向的和直接打印的有很大不同：

```python
# -*- coding: utf-8 -*-

from __future__ import unicode_literals
import sys, locale, os

print("IO encodings:")
print("stdin: {}".format(sys.stdin.encoding))
print("stdout: {}".format(sys.stdout.encoding))
print("stderr: {}".format(sys.stderr.encoding))
print("\ndefault encoding: {}".format(sys.getdefaultencoding()))

print("\ntty(-like) device?")
print("stdin: {}".format(sys.stdin.isatty()))
print("stdout: {}".format(sys.stdout.isatty()))
print("stderr: {}".format(sys.stderr.isatty()))

print("\nPYTHONIOENCODING: {}".format(os.environ.get("PYTHONIOENCODING")))

```

