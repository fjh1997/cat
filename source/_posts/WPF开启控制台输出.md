---
title: WPF开启控制台输出
date: 2020-06-28 23:16:32
tags:
---

工具-选项
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/bdfc752b9ca8b4a6ad4b8cc7a65dab0c.png)
常规-将所有输出窗口文本重定向到即时窗口
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/65be9d2c628a728a645e3c2df2acfd89.png)
项目-属性
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/3d80fba239257c0d6f153284d2b30455.png)
选择-定义DEBUG常数-定义TRACE常量
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/bdd4a316bcbded20f764422ced3fe115.png)
导入System.Diagnostics,使用Debug.writeline或者Trace.Writeline
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/8b07caac3b12d22783a77376e375f202.png)
之后可以在即时窗口看到输出。
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/c6eb370341e694d7e42932d38f80d2ba.png)

