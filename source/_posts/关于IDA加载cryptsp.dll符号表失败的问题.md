---
title: 关于IDA加载cryptsp.dll符号表失败的问题
date: 2020-08-21 15:12:44
tags:
---

最近和师傅们一起做题，有的师傅可以打开cryptsp.dll文件里面显示出很多加密函数


![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/4b22719648b8ed541ffaf6e60c1e73c5.png#pic_center)
但我的就不行是这样
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/54c5cc75936c11faa7e5801392581a25.png#pic_center)
经过查找资料发现是IDA没有成功加载windows的符号表，解决方法如下：
1.安装windbg，首先下载windows 10 sdk installer：
https://developer.microsoft.com/zh-cn/windows/downloads/windows-10-sdk/
勾选这个
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/c51954c31a18ed92c947a78186910af1.png#pic_center)
2.其次如这个帖子所说https://blog.csdn.net/m0_37921080/article/details/80721602###
设置环境变量
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/5307331d9b120dea8a1fb04d3fe88f20.png#pic_center)
```
变量名： _NT_SYMBOL_PATH
变量内容： srv*C:\DownstreamStore*https://msdl.microsoft.com/download/symbols
注意 C:\DownstreamStore 是你要存放符号表的文件夹路径。
```
3.重点的一步来了！记得给IDA挂上梯子（不然无法下载pdb文件），在windows下使用proxifier比较合适。
之后IDA打开类似的系统目录下的dll的时候会自动去symbols server下载相应文件。
当然如果你symchk.exe下载，也需要梯子：

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/74b9e5b2cb27e478f6c90443dd6d8db8.png#pic_center)
从proxifier的日志里可以看出
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/e09212341871032921cf0024e829090b.png#pic_center)
下载pdb文件经过的服务器必须要梯子才能访问。
