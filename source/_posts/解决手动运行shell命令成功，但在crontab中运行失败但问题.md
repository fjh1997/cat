---
title: 解决手动运行shell命令成功，但在crontab中运行失败但问题
date: 2020-03-07 09:08:50
tags:
---

最近遇到了一个问题就是在终端中手动运行shell脚本成功但是在crontab中就会运行失败，检查之后，发现有三个主要原因

> 1.环境变量设置不对,cron默认使用的环境变量是PATH=/usr/bin:/bin
> 2.使用的shell不一样，cron默认使用的shell是/bin/sh
> 3.shell里面使用了alias，但是cron等非交互式shell不能使用alias，需要把alias还原为其原始值。

解决方法如下：
首先在命令行里敲

```bash
echo $PATH
```

然后把输出的内容加到你的shell脚本中：

```bash
export PATH="你之前输出的内容"
```
之后使用以下命令查看你的默认终端shell
```bash
cat /etc/passwd
```
比如,你当前的用户是ubuntu输出以下内容：
```
ubuntu:x:1000:1000:Ubuntu:/home/ubuntu:/bin/bash
```
可以看到最后一列是/bin/bash
那么你就在自己脚本的开头加上：
```bash
#!/bin/bash
```
之后应该就没问题了。
也可以设置crontab的默认shell
```bash
SHELL=/bin/bash
* * * * * your cmd
```
或者
也可以设置crontab的默认shell
```bash
* * * * * bash -c "your cmd"
```
如果是环境变量的问题，需要手段设置PATH
```bash
PATH=xxxx:xxxx
* * * * * your cmd
```
也可以使用点命令.(相当于source)来导入环境变量点配置
```bash
* * * * * . ~/.bash_profile &&your cmd
```
