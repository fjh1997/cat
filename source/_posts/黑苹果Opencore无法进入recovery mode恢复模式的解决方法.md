---
title: 黑苹果Opencore无法进入recovery mode恢复模式的解决方法
date: 2020-02-04 23:38:03
tags:
---

很简单，把VBoxHfs.efi换成HFSPlus.efi即可，如果还是不行，那就在Opencore里面设置， AvoidHighAlloc = YES即可。
或者修改Misc->Boot->HideAuxiliary为false
不修改的话就在选项界面按空格会显示。
参考opencore官方文档。
