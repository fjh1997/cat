---
title: 记一次bandicom录制的mp4文件损坏修复
date: 2020-05-12 14:27:35
tags:
---

最近使用bandicom录制视频文件的时候中途不小心断电了，留下了一个mp4文件，播放器无法恢复，使用010editor打开这个mp4文件，发现仅有两个头的box，
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/0b6ef8939025a5f56f98dc0cdb091d34.jpeg)
和正常的mp4文件比对，缺少了moov数据块![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/ca1b3c54c9efeb0af0db65968e47ce95.jpeg)
经过查询得知mdat主要是存储视频中帧的信息，而moov存储的则是视频帧信息的读取格式。
由于bandicom提取停止，导致来不及写入moov数据块，因此我们首要的任务是恢复moov数据块，这里有一个开源的项目：
https://github.com/anthwlock/untrunc
通过下载链接
https://github.com/anthwlock/untrunc/releases/download/latest/untrunc_x64.zip
打开文件之后我们可以看到两个需要输入文件的地方：
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/6065a80fb997de1a053034285b5e7cc5.png)
这个开源软件的原理就是，通过读取reference file也就是参照的文件，如果你有一个类似的没有损坏的mp4文件，你就可以提取那个mp4文件的moov块信息然后加到损坏的mp4文件中，从而修复损坏的mp4文件。
经过修复，质量非常不错，打星了.
唯一的遗憾是声音与画面不同步，原因是bandicom在录制mp4的时候使用的是动态帧率，每一段时间的帧率都保存在内存里，等录制完成后写入moov头，如果在录制完成前终止的话，虽然帧信息存储在磁盘里，但这些帧率信息都会丢失。
PS：有朋友说下载不下来？
试试这个：链接: https://pan.baidu.com/s/1UcvzMP4X-l5-u36sgeD-qg 提取码: r4rf
