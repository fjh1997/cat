---
title: Macos在桌面上打开终端terminal
date: 2020-05-06 13:42:33
tags:
---

新建文件 desktop.command
输入以下内容:

```bash
cd Desktop
zsh
```
保存后赋予权限执行：
```bash
chmod a+x desktop.command
```
打开访达按住command键然后将这个文件拖到以下两个位置，就可以随时在桌面、边栏，工具栏上面打开桌面的终端。
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/5fc7d945ed3cef5c89b293fb3c103523.png)

推荐一个开源软件cdto：https://github.com/jbtule/cdto，安装后，使用相同的方法可以实现点击工具栏就能在当前目录打开终端，如上图圆圈右侧的那个图标。
