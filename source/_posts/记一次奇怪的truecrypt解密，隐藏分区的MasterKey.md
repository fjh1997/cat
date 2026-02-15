---
title: 记一次奇怪的truecrypt解密，隐藏分区的MasterKey
abbrlink: 3001
date: 2020-05-06 13:35:21
tags:
---

## 地址
**题目地址:** https://buuoj.cn/challenges#[V&N2020%20%E5%85%AC%E5%BC%80%E8%B5%9B]%E5%86%85%E5%AD%98%E5%8F%96%E8%AF%81

## 说明

在这道题里面，最终的一个VOL加密文件，可以通过passphrase和masterkey两种方式进行解密挂载。passphrase解密挂载的方式夏风师傅的博客里面有说，接下来我介绍一下masterkey的挂载方式。
## masterkey解密挂载
首先要提取出内存中保留的masterkey文件，根据这个题目的mem.raw文件，我们做了以下尝试：
**dump cached password**
truecrypt的进程的内存中可能保留了cached password和masterkey。
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/a087438482139d85eea099264bb8771d.jpeg)

故我们先尝试password：

```bash
python vol.py -f mem.raw
--profile=Win7SP0x8 truecryptpassphrase
```
无果
之后尝试masterkey
```bash
 python vol.py -f mem.raw --profile=Win7SP0x8 truecryptmaster -D . 
```
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/71ec2f2fb1f2707475ecf70a6af78da2.png)
可以看到有结果，之后我们使用这个工具：
https://github.com/fjh1997/MKDecrypt
使用masterkey挂载加密分区。
```bash
MKDecrypt.py VOL  ./0x837f51a8_master.key
```
之后可以看到挂载成功的信息

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/6fd433bf089e30d48f173d8c0d3f3134.jpeg)
挂载成功之后拿到key，使用这个key对VOL再次解密可以得到flag。
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/8087f44d3dc263feb6e5e5631e2bb8b3.png)
## 问题来了
那么问题来了，为什么masterkey和pasword解密之后的结果会不一样，按照truecrypt解密的原理，truecrypt先使用pasword解密加密容器的文件头，从文件头中获取这个容器的加密方式和masterkey，之后再使用这两个已知的东西对加密容器进行解密并动态挂载，即把masterkey和pasword暂存在内存中，读取一部分文件解密一部分，并不完全解密。如果这个加密容器只有一个masterkey的话，那么password解密文件头出来的masterkey应该是和之前内存中dump出来的是一致的，解密的结果也一样。那么我们先尝试dump出password解密文件头出来的masterkey。
首先还是一样的步骤，使用password挂载VOL文件，但是环境则是在vmware里面的windows虚拟机里面运行，记得内存设置小一点，挂载成功之后挂起虚拟机之后在虚拟机目录下会出现一个mem文件，使用相同方法在这个文件里面dump出masterkey和password。
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/6118f9a486c3ae8ec8c80e624f1a8071.jpeg)

发现，这个dump出来的masterkey和之前的不一样，也就是说这个password解锁的文件头里面的不包含之前那个masterkey，而是另一个masterkey，那么为什么会这样呢？这就涉及到truecrypt的隐藏分区机制了。
设想一下如下场景：

> 一个歹徒拿着刀逼问你加密磁盘的密码，你迫于无奈只能告诉他。或者战争时期敌军严刑拷打我方特务的时候，只有告诉密码才能赢得生机。

我们常见的truecrypt加密磁盘容器如下一图，分为文件头，加密数据区，随机数据区，通过密码解锁文件头里面的加密方式和密钥信息可以获得加密后的数据。
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/50b0ce3822ce95514cacc1908e6ec6f9.png)
如上二图，在存在隐藏分区的时候，文件头里面的随机数据区则被隐藏文件头所取代，加密数据之后的随机数据出则被隐藏分区所取代，这就让我们无法区分一个加密磁盘里面是否有隐藏分区， 这也意味着同一个加密磁盘容器会对应两个password以及masterkey，当敌人自以为要到了加密的密码，实际上他们不知道这个磁盘还有另一个密码，这就起到了隐藏信息的作用。
使用相同的方式可以解锁隐藏分区，github上面的那个M
KDecrypt的原作者由于没加异常检测，所以不能解密隐藏分析，所以我稍稍改进后传到github上面了。
```bash
MKDecrypt.py VOL  ./0x818471a8_master.key
```
会提示Masterkey does not decrypt a normal/outer volume.  Trying for a hidden volume...
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/0053bf36af8f8d5b64845540ec5c6f3a.png)
# 参考
**参考了夏风大佬的博客:** 
https://blog.xiafeng2333.top/ctf-25/
**以及官方文档** https://www.truecrypt71a.com/documentation/plausible-deniability/hidden-volume/
** 这个PPT挺不错**
https://downloads.volatilityfoundation.org/omfw/2013/OMFW2013_Ligh.pdf
