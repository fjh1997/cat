---
title: freeBSD 14 CURRENT 笔记本核显独显混合安装 nvidia驱动
date: 2021-12-12 23:25:58
tags:
---

注意一定要使用源码ports安装，pkg安装可能导致ko文件与kernel不匹配。
没装核显的先装核显。
```bash
cd /usr/ports/graphics/drm-kmod/ && make BATCH=yes install clean 
sysrc kld_list+=i915kms
```
```bash
cd /usr/ports/x11/nvidia-hybrid-graphics && make BATCH=yes install clean 
kldload nvidia
sysrc kld_list+=nvidia
sysrc nvidia_xorg_enable=YES
service nvidia_xorg start
```
之后可以使用命令nvidia-smi查看，也可以使用nvidia x server settings查看。

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/eb550dca9c0d680bba73b8f7c41597e4.png)
参考：
https://forums.freebsd.org/threads/nvidia-drivers.79549/page-2
https://book.freebsdcn.org/di-er-zhang-an-zhuang-freebsd/di-qi-jie-wu-li-ji-xia-xian-ka-de-pei-zhi
