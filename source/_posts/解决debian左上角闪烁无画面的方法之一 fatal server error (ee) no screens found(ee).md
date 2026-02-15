---
title: 解决debian左上角闪烁无画面的方法之一 fatal server error (ee) no screens found(ee)
abbrlink: 12459
date: 2021-11-15 19:33:04
tags:
---

先查看相关日志
```bash
systemctl status gdm
journalctl -xe|grep gdm
journalctl -u gdm
cat ~/.local/share/xorg/Xorg.0.log
cat /var/log/Xorg.0.lo
```
或者手动启动xsession测试：

```bash
startx

```
看到里面报错是载入/etc/X11/xorg.conf报错的。

```bash
[    55.890] (==) Using config file: "/etc/X11/xorg.conf"
[    55.890] (==) Using system config directory "/usr/share/X11/xorg.conf.d"
[    55.891] (==) ServerLayout "Layout0"
[    55.891] (**) |-->Screen "Screen0" (0)
[    55.891] (**) |   |-->Monitor "Monitor0"
[    55.892] (**) |   |-->Device "Device0"
[    55.892] (**) |-->Input Device "Keyboard0"
[    55.892] (**) |-->Input Device "Mouse0"
[    55.892] (==) Automatically adding devices
[    55.892] (==) Automatically enabling devices
[    55.892] (==) Automatically adding GPU devices
[    55.912] (II) Loading sub module "ramdac"
[    55.912] (II) LoadModule: "ramdac"
[    55.912] (II) Module "ramdac" already built-in
[    55.915] (EE) No devices detected.
[    55.915] (EE) 
Fatal server error:
[    55.915] (EE) no screens found(EE) 
[    55.915] (EE) 
Please consult the The X.Org Foundation support 

```
删除这个文件之后再次startx，居然可以了。
