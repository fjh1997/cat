---
title: no schema for block at 1 index context acpi
abbrlink: 32817
url: /posts/32817.html
date: 2021-02-20 17:03:40
tags:
---

很简单，删除acpi下的block这个项目就可以了，原因是opencore 0.6开始就删除了block这个项目取而代之的是delete
删除block之后不报白色的错误了，但是却卡在黑屏的界面。
之后发现我更新opencore的时候仅仅更新了opencore.efi，实际上github上面下载的整个release文件都要更新，更新之后就解决了。
参考：https://www.reddit.com/r/hackintosh/comments/i4l3zh/ocs_no_schema_for_block_at_4_index_context_acpi/

