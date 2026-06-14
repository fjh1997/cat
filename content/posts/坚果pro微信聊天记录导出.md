---
title: 坚果pro微信聊天记录导出
abbrlink: 47862
url: /posts/47862.html
date: 2021-11-09 21:00:35
tags:
---

用9008把userdata分区导出，
参考：https://zhuanlan.zhihu.com/p/35422254
可能会失败


> windows api readfile failed your device is probably *not* on this port
01:47:56: ERROR: function: sahara_rx_data:194 Unable to read packet header. Only read 0 bytes.
01:47:56: ERROR: function: sahara_main:854 Sahara protocol error
01:47:56: ERROR: function: main:265 Uploading Image using Sahara protocol failed

失败就换电脑或者数据线。或者更新QPIL版本，我的是QPST 2.7.460，下载地址：
https://bbs.smartisan.com/forum.php?mod=viewthread&tid=1186098
导出之后发现分区居然没有加密。使用diskgenius可以打开。
![在这里插入图片描述](/images/9f84d8ede47956d07019cc907d4bdc3b.png#pic_center)

项目地址：https://github.com/sguangxuan/WeChat-chat-history-analysis



IEMI获取：

```bash
 /data/com.tencent.mm/shared_prefs/DENGTA_META.xml
 
    <string name="BEACON_QIMEI_1"> </string>

```
可能不是15位的，是14位的
uin获取：

```bash
 /data/com.tencent.mm/shared_prefs/auth_info_key_prefs.xml
     <int name="_auth_uin" value=" " />

```
拼接完25位弄md5.
