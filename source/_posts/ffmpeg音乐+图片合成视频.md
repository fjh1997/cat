---
title: ffmpeg音乐+图片合成视频
date: 2021-02-07 22:10:30
tags:
---

```bash
ffmpeg -loop 1  -i ./虹色カーテン.jpg -i videoplayback.webm -shortest -s  1090x1080 result.mp4 
```
注意这里的-loop 1参数一定要放在最前面，不然会失效。这里的-shortest 表示视频长度刚好为音乐的长度。
PS:最近接到一个单子，我寻思着太简单了，不好意思收费，干脆公开吧。

> 您好！数百张图片（如001.bmp、002.bmp...），与一个mp3音频，要合成一个视频（.mp4）。要在不同时间点开始显示某张图片。
>
>图片	显示时间起点(分:秒:毫秒。如 02:12:89，指2分12秒>81。81是0.81秒。)。假设有256张图片。
>001.bmp	00:00:00
>002.bmp	00:01:77
>...
>255.bmp	03:52:99
>256.bmp	03:55:81
>
>若mp3文件长度是 3'58"71，则本视频总长度即音频长度。
>
>想用ffmpeg来实现。能帮忙吗？给报酬。
>

如下脚本，里面的-t表示这张图片持续时间。
```bash
for f in *.jpg; 
do 
    ffmpeg -y -i "$f" -vf scale=320:240 -vf setsar=1  "$f";  
done

ffmpeg -y \
 -loop 1 -t 1 -i QQ20210120-1.jpg \
 -loop 1 -t 1 -i QQ20210121-0.jpg \
 -loop 1 -t 4 -i QQ20201230-2.jpg \
 -loop 1 -i QQ20210107-0.jpg \
 -i rainforest-ambient.mp3 \
 -filter_complex "concat=n=4" -shortest \
 -c:v libx264 -pix_fmt yuv420p -c:a aac video.mp4
```
参考：https://stackoverflow.com/questions/50048052/ffmpeg-images-to-video-with-different-start-times-and-durations
