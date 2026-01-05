---
title: debian11删除swap分区之后出现mdadm no arrays found in config file or automatically的的解决方法
date: 2021-12-07 13:51:40
tags:
---

原因是swap分区没了之后影响了启动逻辑。删除resume=uuid即可。

```bash
sudo rm /etc/initramfs-tools/conf.d/resume
sudo update-initramfs -u

```
参考：https://www.reddit.com/r/debian/comments/h8b0am/dell_optiplex_390_gets_stuck_on_mdadm_no_arrays/
