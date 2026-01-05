---
title: pip安装出现ZIP does not support timestamps before 1980 pip
date: 2021-06-30 21:55:54
tags:
---

可能是安装文件的修改日期不对，使用以下命令批量修改当前文件夹里面的文件的修改日期即可：

```bash
find . -type f -exec touch {} +
```

