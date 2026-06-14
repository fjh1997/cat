---
title: 解决ssh 终端连上去vim右键粘贴变 visual 的问题
abbrlink: 59045
url: /posts/59045.html
date: 2021-01-23 12:19:47
tags:
---

![在这里插入图片描述](/images/50f0ebbf82c3d6f40c85e94143b2848e.png)




解决方法：右键出visua模式后，shift+右键两下，出来菜单然后粘贴。
![在这里插入图片描述](/images/5d95c195b59c01e0c654579779c92190.png)

或者还有一个更加通用的方法，在windows或者linux下是ctrl+v,在macos下是command+v也能直接粘贴。

再简单点，在命令模式下设置:set mouse=
