---
title: 大麦dw11sa不拆机刷机padavan+breed
abbrlink: 27202
url: /posts/27202.html
date: 2021-02-04 22:43:26
tags:
---

下载breed https://breed.hackpascal.net/
选择https://breed.hackpascal.net/breed-mt7620-reset1.bin

进入http://192.168.10.1/upgrade.html
固件那里选择刚刚刷好的固件，在密码处填写
```bash
 password | mtd -x mIp2osnRG3qZGdIlQPh1 -r write /tmp/breed-mt7620-reset1.bin BootLoader
```
之后等待刷机完毕机器重启，没问题之后，断电，按住复位键的同时上电再等待几十秒后http://192.168.1.1如果看到breed控制台就是成功。
大麦路由flash 是16M  内存是64M了
之后下载padavan固件：
https://opt.cn2qq.com/padavan/RT-N14U-GPIO-1-RY1-64M2_3.4.3.9-099_16M.trx
之后在breed控制台里选择这个固件升级即可，注意大麦dw11sa本身硬件上就不支持5G，所以刷好固件后没有5G是正常的。
