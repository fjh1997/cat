---
title: mac OS 10.15 catalina内录声音同时使用quicktime录屏教程
abbrlink: 2000
url: /posts/2000.html
date: 2020-03-14 21:23:42
tags:
---

更新：安装hijack吧，这个效率更高，支持多个软件混合录制声音
https://rogueamoeba.com/audiohijack/
首先安装BlackHole [https://github.com/ExistentialAudio/BlackHole](https://github.com/ExistentialAudio/BlackHole)
其次根据这个教程在MIDI里面设置多输出设备
[https://github.com/ExistentialAudio/BlackHole/wiki/Multi-Output-Device](https://github.com/ExistentialAudio/BlackHole/wiki/Multi-Output-Device)
![在这里插入图片描述](/images/26fbfea43162cc61c85be6f897b20a25.png)
在多输出设备里面排序使得内建输出排第一个，同时给内建输出和BlackHole都打上勾
![在这里插入图片描述](/images/c20f54bc6ec562e90ca3af6222473650.png)
选择将此设备用于声音输出
![在这里插入图片描述](/images/c5a17cfdc599136594418bc8a81659e9.png)
之后录制的时候选BlackHole即可
![在这里插入图片描述](/images/122313157b6f1d1197d28dda92b5eeb7.png)
右键quicktime设置录屏
![在这里插入图片描述](/images/72d647a6aca240f0cdbdad66f2b401c4.png)
麦克风选择blackHole即可

 <img src="https://i-blog.csdnimg.cn/blog_migrate/e2128b7a7f14225334d397c5326772a2.jpeg" width="60%" alt=""/>
