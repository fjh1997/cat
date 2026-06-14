---
title: desktop entry不显示原因分析
abbrlink: 29543
url: /posts/29543.html
date: 2021-12-30 12:19:51
tags:
---

1.desktop文件的权限需要为当前图形化界面用户可读。
2.`~/.local/share/applications`会覆盖`/usr/share/applications`的同名的desktop文件。如果`~/.local/share/applications`里的文件损坏，即使`/usr/share/applications`文件良好也无法显示。
3.使用`desktop-file-validate telegramdesktop.desktop`检查错误再使用`update-desktop-database`更新图标。
4.desktop file里面有`NoDisplay=true`
