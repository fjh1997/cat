---
title: flask_apscheduler  Unable to determine the name of the local timezone
abbrlink: 25951
date: 2020-04-05 10:46:14
tags:
---

最近在配置flask_apscheduler遇到了问题：

> ValueError: Unable to determine the name of the local timezone -- you
> must explicitly specify the name of the local timezone. Please refrain
> from using timezones like EST to prevent problems with daylight saving
> time. Instead, use a locale based timezone name (such as
> Europe/Helsinki).

解决方法是添加环境变量：
```python
import os
os.environ['TZ']= 'Asia/Shanghai'
```

