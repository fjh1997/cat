---
title: 解决银河麒麟os上steam++无法启动加速的问题
date: 2024-11-12 19:38:07
tags:
---

使用steam++加速github，点启动加速会提示/etc/hosts权限问题，修改了权限之后无效，提示无法写入，换做nano手动写入的时候却可以，经过研究，发现strace的openat系统调用参数一致，但是steam++的却提示无法打开写入，权限不足，猜测是系统内核里面有审计系统，毕竟是信创系统嘛。经过查询，发现确实有一个类似的审计系统kysec，大概是实现了selinux的强制访问原则，于是查资料关闭kysec即可
```bash
setstatus softmode -p
```
安全中心里面也尽可能关闭。
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/aef0f49448794135a764ccaae856d235.png)
如果用自带的奇安信浏览器github提示证书错误，还需要去浏览器设置里面添加信任证书。
