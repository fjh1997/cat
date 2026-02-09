---
title: >-
  xtigerVNC systemd失败提示 Unrecoverable failure in required component
  org.gnome.Shell.desktop
abbrlink: 52319
date: 2022-02-23 10:12:55
tags:
---

>  Unrecoverable failure in required component org.gnome.Shell.desktop
2月 23 09:47:36 jiudao-HP-Z230-Tower-Workstation gnome-session-binary[8871]: WARNING: App 'org.gnome.Shell.desktop' respawning too quickly

解决方法：使用以下systemd文件，不知道为什么使用'User=username'这样总是会出错。


```bash
[Unit]
Description=TigerVNC Service
After=syslog.target network.target

[Service]
Type=simple
RemainAfterExit=yes
SuccessExitStatus=0

PIDFile=/home/username/.vnc/%H:%i.pid
ExecStartPre=/bin/su -l username -c "/usr/bin/tigervncserver -kill :%i > /dev/null"
ExecStart=/bin/su -l username -c "/usr/bin/tigervncserver :%i -localhost no"
ExecStop=/bin/su -l username -c "/usr/bin/tigervncserver -kill :%i"

[Install]
WantedBy=default.target
```
启动方法：

```bash
systemctl start vncserver@1
```
参考：https://unix.stackexchange.com/a/611494/337890
