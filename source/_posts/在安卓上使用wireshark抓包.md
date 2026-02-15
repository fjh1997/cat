---
title: 在安卓上使用wireshark抓包
abbrlink: 51870
date: 2020-06-19 22:34:29
tags:
---

需要用到一个软件，叫做pcap remote。
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/283781a2b7b79cb28d4b7c0dd6c0bdd6.png)
选择开始抓包后，在另一个电脑上使用ssh连接，输入命令：

```bash
ssh user@192.168.2.229 -p 15432 'pcapremote' > test.pcap
```
可以得到pcap数据包，之后使用wireshark打开分析即可。
