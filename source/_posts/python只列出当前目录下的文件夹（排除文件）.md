---
title: python只列出当前目录下的文件夹（排除文件）
date: 2021-09-07 22:38:50
tags:
---

使用pathlib
```python

from pathlib import Path

path = Path('.')

dirs = [e for e in path.iterdir() if e.is_dir()]

for dir in dirs:
    print(dir)
```
使用os.walk

```python
import os
output = [dI for dI in os.listdir('foo') if os.path.isdir(os.path.join('foo',dI))]
print(output)
```

