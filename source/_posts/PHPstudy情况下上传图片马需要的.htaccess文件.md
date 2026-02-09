---
title: PHPstudy情况下上传图片马需要的.htaccess文件
abbrlink: 44075
date: 2024-06-01 21:44:00
tags:
---

网上的方法是无效的：
```bash
<FilesMatch "test.jpg">
    SetHandler application/x-httpd-php
  </FilesMatch>
```
原因是新版本的phpstudy使用了cgi模式,而网上的方法只适用于linux模式。
```bash
<FilesMatch "tpm.png">
AddHandler fcgid-script .png
FcgidWrapper "D:/phpstudy_pro/Extensions/php/php7.3.4nts/php-cgi.exe" .png
</FilesMatch>
```
参考：https://cloud.tencent.com/developer/article/1523311

