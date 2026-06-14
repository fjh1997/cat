---
title: 使用powershell修改文件的最近修改日期
abbrlink: 19970
url: /posts/19970.html
date: 2021-03-18 21:29:44
tags:
---

```powershell
(Get-Item "D:\xxx").LastWriteTime=("18 March 2021 17:00:00")
```

