---
title: ffmpeg视频提取图像帧，相同帧宽分辨率降低的原因分析
abbrlink: 22321
date: 2020-05-07 11:26:46
tags:
---

最近因为要做一道题 ，roarCTF的黄金六年，使用了ffmpeg对视频进行帧提取。
首先使用了如下命令
```bash
ffmpeg -i 6.mp4  extracted\foo-%03d.jpg
```
之后提取到的图片十分模糊。尤其是里面的二维码，十分模糊根本无法分析。
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/ecd49748fd50dc0a3d22687e8f8fc849.jpeg)
怀疑是图片分辨率与视频的帧宽不同导致的，结果看了日志，发现帧宽是一样的。
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/7c72da724976c2683035efc4192358d1.jpeg)

帧率30fps，分辨率都是960x560。也就是说“理论上”视频每帧的图像信息没有丢失。
之后换了更大的分辨率，结果二维码就更清晰了
```bash
ffmpeg -i 6.mp4 -s 4096×2160 extracted\foo-%03d.jpg
```
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/2a80ff947de2c1f6ad0821193d23119e.jpeg)
## 问题来了
那么问题来了，既然视频里面的帧宽是960x560，按照这个帧宽提取的话原视频的信息应该是提取全了的，可是为什么使用更大的帧宽就会提取的更加全面更加清晰呢？难道原视频的帧宽不是960x560么？

事实上这涉及到jpeg的有损压缩技术。我们继续使用960x560的分辨率，但是不要保存为jpg而是保存为bmp或者png这种无损格式的图片。
```bash
ffmpeg -i 6.mp4 -s  extracted\foo-%03d.bmp
```
结果我们得到了分别率是960x560但是清晰度和4k的jpg一样的图片。
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/1dbef56f7e73190d5a1067e1c52aac47.jpeg)
通过仔细分析，我们可以通过放大镜来查看相同分辨率的jpg和bmp，我们会看到，jpg的显示方式是通过一个个有渐变色的像素方块，而bmp的显示方式则是一个纯色的像素方块。
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/903325fa9cef476c6c27d1eb5a65cec4.jpeg)
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/0e598a13d9bc42845ab28b3e1baf2f05.jpeg)
jpg使用了这种算法对图像进行有损压缩存储，因而图像大小十分小，同一张图，以960x560为例，bmp的存储高达1M，而jpg的存储则只有12k，即使是4k的jpg存储大小也只有108k。
我们再把提取视频时候的输出格式设置为为png，结果得到了和bmp一样清晰的图片，但大小只有200k左右，png使用了无损压缩，既减小了图像的存储又保留了清晰度，推荐使用。
