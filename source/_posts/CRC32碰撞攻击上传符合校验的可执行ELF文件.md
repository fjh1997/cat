---
title: CRC32碰撞攻击上传符合校验的可执行ELF文件
abbrlink: 44799
date: 2021-05-31 14:45:53
tags:
---

昨天第六届XCTF比赛比完了。队友说做到了个奇怪的题目。要求上传gdb的debug文件，但是debug文件的crc文件需要符合一定的crc校验值。
我们知道debug文件也是一种elf文件，elf文件需要满足他的可执行性就不能随便更改，但是恰好crc32本质也只是一种纠错码，对碰撞率的要求很低，我们可以在elf文件的结尾添加一些字符来使得他的crc满足一定的要求就行了。
使用如下工具可以轻易办到：
https://github.com/theonlypwner/crc32

首先查看原elf文件的crc32，比如是0x9ef13194我们需要他变到0x6751FC53，那么使用以下命令即可：


```bash
 ./crc32.py reverse 0x6751FC53 0x9ef13194
 ```
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/8e4a7cca141a2f24805fdc1e6c4d39c9.png#pic_center)
上面找出来很多补丁，随便选一个比如说是0gMchf

之后使用
```bash
echo -n 0gMchf>> elf 
```
注意上面要加-n，不然的话会多加一个空格，
这样就可以把elf的crc从0x9ef13194修改为0x6751FC53，同时不影响文件执行。
