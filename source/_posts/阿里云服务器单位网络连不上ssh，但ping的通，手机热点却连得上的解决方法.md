---
title: 阿里云服务器单位网络连不上ssh，但ping的通，手机热点却连得上的解决方法
date: 2025-09-17 14:18:26
tags:
---

ssh数据包被reset了。抓包发现rst数据包的ttl和【syn，ack】的ttl数据包值相同。应该是阿里那边拦截了。

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/42a96bffaeec43ffa2eb8e7c93a4e004.png#pic_center)


首先，单位可能有多个出口ip。要双向抓包。服务端和客户端用wireshark抓包。发现真实的出口ip。

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/414698e84b304eea9748959736c7200a.png)



之后去登录阿里云云盾安全管控平台管理控制台（https://yundun.console.aliyun.com/?spm=a2c4g.11186623.0.0.769d8da5JMVb3I&p=sc）。
在左侧导航栏，单击白名单管理 > IP白名单。
单击添加单位的出口ip即可。一开始添加无效，原因是通过查询cip.cc得到的ip不一定是访问阿里云的出口ip.
