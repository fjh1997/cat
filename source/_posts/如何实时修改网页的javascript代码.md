---
title: 如何实时修改网页的javascript代码
abbrlink: 1846
date: 2020-07-26 08:19:08
tags:
---

最近在做upload-labs需要修改网页的js代码，貌似比较复杂，记录留念一下。
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/74c6785f25f0ea2dca4d25d4e8b1e73a.jpeg)
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/e555a5a0355a30bbda8681129e8ed5a1.jpeg)

首先我们打开开发人员工具做修改，试图在element编辑框内修改代码，把上传的文件改为允许php，然而修改的代码并不会生效，因为chrome已经在内存里加载了这段代码，要重新加载代码只能靠刷新，然而刷新会丢失我们所作的修改，那么应该怎么做呢？
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/df10f02a7c15bd95b671696577fbf213.jpeg)
其实很简单，首先需要在source-overrides界面里面select folder for overrides，然后选择一个文件夹。
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/c12150feba347214e3bc868c4c886f23.jpeg)
我随便选了一个文件夹，就有权限访问的提示。
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/881304c96c77c00b94bb7227b6c4b904.jpeg)
选择完毕后记得打上勾Enable Local Overrides。
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/f97921e4f38e5dc0617928fbb41c2306.jpeg)
之后中source里面编辑你要编辑的代码文件，如index.php,增加文件上传类型.php
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/f6ff00202c5cfbaa1bcc1c58281e6591.jpeg)
右键 Save for overrides
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/fa5a3ef16b90b71252204cbb7e9d3ee2.jpeg)
保存成功后，文件边上会出现一个紫色的点，之后就可以在里面写代码编辑了，之后的编辑都还需要须手动保存（也可以在本地使用其他编辑器如记事本编辑），点击这个save as（另存为）后即可保存，可以不另存为，也可以使用command 面板或者快捷键ctrl+s来保存，（ctrl+f是搜索）感觉不是很方便估计还需要改善。
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/2b321005838fc35933ddf6f892454cc6.png#pic_center)
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/699ec6866dcbd8b927b7bca4c4b75f6b.png#pic_center)
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/d48526b1ec8009c3b1a8971822d5222f.png#pic_center)

如果不成功的话则是黄色三角形加感叹号。之后刷新页面即可。





