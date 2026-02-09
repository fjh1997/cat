---
title: 使用inflate.py 直接解压deflate数据
abbrlink: 23966
date: 2021-01-21 13:21:11
tags:
---


众所周知，zip文件的压缩原理的本质就是deflate数据，他和zlib格式的唯一不同就是文件的元数据不太一样，当我们遇到deflate数据的时候其实可以直接使用python的这个工具来提取。
```python
#!/usr/bin/env python3

import sys
import zlib

def inflate(data):
    """Returns uncompressed data."""
    return zlib.decompress(data, -zlib.MAX_WBITS)

def main():
    """Read deflate compressed data from stdin and write uncompressed data to stdout."""
    sys.stdout.buffer.write(inflate(sys.stdin.buffer.read()))

if __name__ == "__main__":
    main()

```
用法
```bash
tools/inflate.py < decipheredfile > decompressedfile

```

参考：https://github.com/kimci86/bkcrack/blob/master/tools/inflate.py
