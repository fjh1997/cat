---
title: debian11 gnome安装fcitix5
date: 2021-11-29 23:29:13
tags:
---

默认debian用了ibus，需要先卸载。如果装了fcitix4也卸载。
```bash
sudo apt remove fcitx*
sudo apt remove ibus*

```
之后按照这里：https://wiki.debian.org/zh_CN/I18n/Fcitx5
安装fcitx5

```bash
apt install --install-recommends fcitx5 fcitx5-chinese-addons gnome-shell-extension-kimpanel fcitx5-frontend-gtk3  fcitx5-frontend-gtk3 fcitx5-frontend-gtk2:i386 fcitx5-frontend-qt5 fcitx5-frontend-gtk3:i386 fcitx5-rime  libgtk-3-bin fcitx5-config-qt


```
为什么要装这么多东西呢？因为有的程序是用qt开发的有的程序是用gtk开发的，有的是gtk2有的是gtk3还有的是各自的x86版本，装这些库是为了让这个输入法兼容这些程序。
之后使用命令`fcitx5-diagnose`进行诊断

> Environment variable QT_IM_MODULE is "fcitx5" instead of "fcitx"

其中 im-config可能会出现问题（详见https://bugs.debian.org/cgi-bin/bugreport.cgi?bug=977203），我们直接安装sid版本新版的im-config
```bash
wget http://ftp.us.debian.org/debian/pool/main/i/im-config/im-config_0.49-1_all.deb
apt install ./im-config_0.49-1_all.deb

```
安装完毕之后使用`im-config`配置：

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/828165b9877fa5798b223e770f3c72e7.png)
选择是：
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/1668d00538332bc1c060acf763c83ad9.png)
选择fcitx5。
之后重启。之后如果还是不行，使用`fcitx5-diagnose`再次进行诊断。如果是

>   **无法找到 gtk 3 的 `gtk-query-immodules`.**

在～/.profile添加环境变量重启即可：
例：
```bash
PATH=$PATH:/usr/lib/i386-linux-gnu/libgtk-3-0:/usr/lib/x86_64-linux-gnu/libgtk-3-0:/usr/lib/i386-linux-gnu/libgtk2.0-0:/usr/lib/x86_64-linux-gnu/libgtk2.0-0;export PATH;
```

详见：https://github.com/fcitx/fcitx/issues/296
最后在这里启用一下：
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/144a5edd5c628ed3ee788df3f04c971b.png)
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/e4c7cec186a74415e339ec3d3390f7f7.png)
之后重启。\
但是这样会出现一个问题，就是ibus和fcitx两个共存了![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/7e4bbaf3b5d2dd66dc072b6200f084e8.png)
这个需要删除所有的输入源防止冲突：

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/8333c33eed6d4f35ef913ffe45066ee1.png)


详见：https://wiki.debian.org/gnome-chinese-input

吐槽下，gnome conrtol center不支持fcitix，只支持ibus,虽然是开源的，但是提交了补丁也未必接受。
做插件也不开放api。

详见:https://forum.ubuntu.org.cn/viewtopic.php?f=8&t=486270&sid=4818e286271ddf79ad86542cad35daac&start=15
记得启用云拼音，设置百度：
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/28a2596273fe91ec97abb5613fe9bf92.png)
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/ecdc69971044c16ae8e4c10cf1925099.png)
之后导入字典，建议用这个：https://github.com/cathaysia/fcitx5_dicts

```bash
python main.py
```
之后放到：

```bash
~/.local/share/fcitx5/pinyin/dictionaries/
```
就行了。
但是发现不怎么好用，后面又装了个中州韵，但是没有云拼音。
