---
title: 将python程序等的输入输出重定向至某个端口
date: 2020-05-29 14:19:05
tags:
---

需要安装ncat，比如重定向到8888端口
```bash
ncat -l 8888 -e "python -u demo.py"
```
或者
```bash
ncat -l 8888 -c "python -u demo.py" 
```
如果要给多个用户多个连接提供服务，每个用户连上之后提供一个fork的进程的话。加上--keep-open参数即可。
```bash
ncat -l 8888 -e "python -u demo.py" --keep-open
```
或者：
```bash
ncat -l 8888 -c "python -u demo.py" -k
```
