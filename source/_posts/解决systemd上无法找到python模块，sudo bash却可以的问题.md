---
title: 解决systemd上无法找到python模块，sudo bash却可以的问题
abbrlink: 51264
date: 2020-08-11 12:07:00
tags:
---

有些命令```sudo bash```下的命令能够成功但systemd不可以的主要的原因是```sudo bash```的本质是上一个shell fork的子进程shell。虽然也是以 root权限运行的，但继承了上一个shell的一些环境，所以和systemd的用户root还是有区别的。如果要测试systemd的root用户运行的功能，则需要使用```su root```来运行，如果要以之前的用户运行，则直接在[Service]下制定User即可。

```bash
[Unit]
Description=feiduichengde
[Service]
ExecStart=/bin/bash -c "/usr/bin/python3.8 /home/ubuntu/challenges/feiduichengde/task.py" 
Restart=always
User=ubuntu
StandardOutput=syslog
StandardError=syslog
[Install]
WantedBy=multi-user.target
```

