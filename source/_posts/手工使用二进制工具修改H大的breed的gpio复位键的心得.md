---
title: 手工使用二进制工具修改H大的breed的gpio复位键的心得
date: 2021-10-15 15:34:45
tags:
---

致敬下H大的breed帖子：https://www.right.com.cn/forum/thread-161906-1-1.html
H大的这个breed很好用，但是可能是因为NDA的关系，不开源就有点可惜。最近遇到一个TL-WAR308路由器，但是去了H大的仓库看了下http://breed.hackpascal.net/，发现只有breed-qca953x-letv-lba-047-ch.bin这个breed能用，但是这个breed的reset键设置的是gpio17，而我的路由器复位键是gpio 14。去帖子上看了下说明，发现只有结尾是blank的breed才能通过环境变量设置gpio，我这个没带blank就不行。
那该怎么办呢？就硬怼。首先使用binwalk来分析breed固件的结构：

```bash
binwalk breed-qca953x-letv-lba-047-ch.bin

DECIMAL       HEXADECIMAL     DESCRIPTION
--------------------------------------------------------------------------------
10228         0x27F4          Copyright string: "Copyright (C) 2020 HackPascal <hackpascal@gmail.com>"
10648         0x2998          LZMA compressed data, properties: 0x6D, dictionary size: 33554432 bytes, uncompressed size: 289721 bytes
```
发现breed固件又两部分组成，一部分是前面部分的raw数据，另一部分是通过LZMA压缩过的数据。
使用命令:`binwalk -e breed-qca953x-letv-lba-047-ch.bin  `
解压出一个名为2998的文件以及一个名为2998.7z的文件，这个应该就是LZMA解压出来的数据以及LZMA压缩数据。
使用010editor在这里面看了看，好像没有明细看到定义gpio的地方，于是就想到做对比。
使用相同方法分别解压h大的固件breed-qca956x-uart_rx18_tx20-reset1.bin和breed-qca956x-uart_rx18_tx20-reset2.bin，发现了神奇的现象：
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/a7b42ea11a2aac164402b882bf38a154.png#pic_center)
发现这两个固件的lzma解压出来的部分只有一处不同，而且恰好对应reset1 和reset2
即24 04 00 01 24 05 00 01与24 04 00 02 24 05 00 01
再次比对了下breed-mt7620-reset11.bin和breed-mt7620-reset12.bin发现也是只有一位不同，也恰好对应的是0xB和0xC也就是reset11和reset12
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/cd8b534de5447e82f95944f380e506b8.png#pic_center)
即0B 00 04 24 01 00 05 24和0C 00 04 24 01 00 05 24
发现和前面那对固件差不多，那应该是大小端不同的原因导致不同。
由于我要刷的路由器固件是qca9533的所以更应该参考qca956x即前面这对固件的信息。
那么接下来的问题就是对lzma解压出来的数据进行修改然后重新打包回lzma。
使用binwalk解压breed-qca953x-letv-lba-047-ch.bin果然发现了24 04 00 11 24 05 00 01，0x11是17，那么改成0xe就可以改成14了
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/c217bd44cf4e5da06a59ce67d4dd8ea3.png#pic_center)
但是lzma算法有很多种参数形式，到底哪种合适呢？
于是我使用7z看了一下发现算法是 LZMA:25:lc1:lp2
也就是数据字典大小是25的LZMA算法。
正好，我看了下openwrt的工具链里面提供这个工具
[https://downloads.openwrt.org/releases/17.01.0/targets/ar71xx/generic/lede-sdk-17.01.0-ar71xx-generic_gcc-5.4.0_musl-1.1.16.Linux-x86_64.tar.xz](https://downloads.openwrt.org/releases/17.01.0/targets/ar71xx/generic/lede-sdk-17.01.0-ar71xx-generic_gcc-5.4.0_musl-1.1.16.Linux-x86_64.tar.xz)
解压工具链使用工具链里面的lzma工具可以看到一些选项：

```bash
ubuntu@ubuntu:~/lede-sdk-17.01.0-ar71xx-generic_gcc-5.4.0_musl-1.1.16.Linux-x86_64/staging_dir/host/bin$ ./lzma -h

LZMA 4.65 : Igor Pavlov : Public domain : 2009-02-03

Usage:  LZMA <e|d> inputFile outputFile [<switches>...]
  e: encode file
  d: decode file
  b: Benchmark
<Switches>
  -a{N}:  set compression mode - [0, 1], default: 1 (max)
  -d{N}:  set dictionary size - [12, 30], default: 23 (8MB)
  -fb{N}: set number of fast bytes - [5, 273], default: 128
  -mc{N}: set number of cycles for match finder
  -lc{N}: set number of literal context bits - [0, 8], default: 3
  -lp{N}: set number of literal pos bits - [0, 4], default: 0
  -pb{N}: set number of pos bits - [0, 4], default: 2
  -mf{MF_ID}: set Match Finder: [bt2, bt3, bt4, hc4], default: bt4
  -mt{N}: set number of CPU threads
  -eos:   write End Of Stream marker
  -si:    read data from stdin
  -so:    write data to stdout

```
那么，我们使用dictionary size为25，number of literal context bits为1，number of literal pos bits为2的LZMA算法就行了。

```bash
./lzma e -d25  -lc1 -lp2 2998 2998.lzma
```
把压缩好的数据2998.lzma替换到breed里面相同偏移的位置就可以了。因为这种lzma算法压缩出来的数据开头是6D 00 00 00对应前面的2998.7z
之后插电开机发现果然修改成功了。
把压缩好的数据2998.lzma替换到breed里面相同偏移的位置就可以了。因为这种lzma算法压缩出来的数据开头是6D 00 00 00对应前面的2998.7z
之后插电开机发现果然修改成功了。
至于怎么检测复位键属于哪个GPIO使用breed里面的内置命令btntst就可以了（详见H大原帖五楼），通过ttl连上breed之后，开启了btntest之后会显示类似下面这种信息，序号对应的就是breed。

```bash
GPIO#14  (<gpio0,14>) changed to 0
GPIO#14  (<gpio0,14>) changed to 1
```


如果是led的可以用gpio get set命令来测，可以看到lo和hi高低电位的变化。
