---
title: ffmpeg根据开始时间结束时间切割视频
date: 2020-05-10 15:54:39
tags:
---

1.根据开始时间结束时间,to+结束时间注意这几个参数的顺序不能错误，-i必须要第一个，不然会转化为方案二，根据时长
```bash
ffmpeg  -i input.mp4 -ss 00:01:00 -to 00:02:00 -c copy output1.mp4
```
2.根据时长切割视频
```
ffmpeg  -i input.mp4 -ss 00:01:00  -t 00:02:00 -c copy output2mp4
```


之后可以写一个文件来合并视频

```
file 'output1.mp4'
file 'output2.mp4'
file 'output3.mp4'
```
然后：
```
ffmpeg -f concat -i file.txt -c copy output.mp4
```


