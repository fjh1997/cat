---
title: worepress使用相对路径访问网站
abbrlink: 40202
date: 2020-07-21 17:09:24
tags:
---

在wp-config.php写入以下语句：

```php
define('WP_HOME', '/');
define('WP_SITEURL', '/');
```
这样在设置中的URL会显示空白，这就是使用了相对路径，不然的话难以兼容http和https协议。
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/c9eff67d27045d1c80ef0b30f61c5940.png)

