---
title: 记一次root无法登录的情况
date: 2024-12-11 16:48:14
tags:
---

grub里面改了密码也没用，于是关闭quiet开启日志，结果发现/etc/passwd被selinux拦截了，于是去/etc/selinux/config里面关闭即可。类似这样的错误：
audit(1733934483.186:122):avc: denied { open } for pid=814 comme="dbus-dae
mon="/etc/passwd" dev="dm-0"ino=20088836 scontext=system_u:system r:system_dbusd_t:s0-s0:c1023 tcontext=system_u:object _r:unlabeled_t:s0 tclass=file permissive=8
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/4c87c24ccc9341cd953286697292c31d.jpeg)
经过排查，selinux设置错误，正常的是

```bash
$ ls -Z /etc/passwd 
system_u:object_r:passwd_file_t:s0 /etc/passwd
```
结果变成他变成system_u:object_r:unlabeled_t:s0 /etc/passwd，ext4扩展属性出现问题
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/56f13a784c9340548d77538e794ea8f2.jpeg)
/var/log/secure里面可以看到报错日志：
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/3b30aefb20ed4d81bc343a43176fdd86.png)
结合unix_chkpwd的selinux属性chkpwd_exec_t
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/7edbce6eb4a0410fb565943b078d431c.png)
可能由于passwd_file_t标签丢失导致
