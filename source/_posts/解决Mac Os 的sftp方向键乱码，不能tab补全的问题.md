---
title: 解决Mac Os 的sftp方向键乱码，不能tab补全的问题
date: 2021-02-01 12:17:11
tags:
---


首先打开终端输入以下命令查看你的sftp是什么版本
```bash
 which sftp
```
如果返回结果是 `/usr/bin/sftp`, 说明你用的是macos 官方原装的sftp( [源码][1]
)
这个原装的sftp比较烂，所以我们可以选择安装homebrew的版本
```bash
brew install openssh
```
安装完后，我们可以列出openssh的安装路径
 ```bash
 brew list openssl
```
会显示这类openssh的组件
```bash
/usr/local/Cellar/openssh/8.4p1_2/.bottle/etc/ (12 files)
/usr/local/Cellar/openssh/8.4p1_2/bin/scp
/usr/local/Cellar/openssh/8.4p1_2/bin/sftp
/usr/local/Cellar/openssh/8.4p1_2/bin/slogin
/usr/local/Cellar/openssh/8.4p1_2/bin/ssh
/usr/local/Cellar/openssh/8.4p1_2/bin/ssh-add
/usr/local/Cellar/openssh/8.4p1_2/bin/ssh-agent
/usr/local/Cellar/openssh/8.4p1_2/bin/ssh-keygen
/usr/local/Cellar/openssh/8.4p1_2/bin/ssh-keyscan
/usr/local/Cellar/openssh/8.4p1_2/libexec/ (4 files)
/usr/local/Cellar/openssh/8.4p1_2/sbin/sshd
/usr/local/Cellar/openssh/8.4p1_2/share/man/ (15 files)
```

现在再试下
```bash
   which sftp
```
结果如果返回的是 `/usr/local/bin/sftp`,那说明你安装homebrew的版本的sfp成功了，`/usr/local/bin/sftp`是`/usr/local/Cellar/openssh/8.4p1_2/bin/sftp`的一个软链接。

现在方向键和tab补齐应该能使用了吧。

来源：[https://superuser.com/questions/1543592/sftp-from-macos-to-ubuntu-does-not-support-arrow-keys-backspace-or-tab-complet/1622315#1622315](https://superuser.com/questions/1543592/sftp-from-macos-to-ubuntu-does-not-support-arrow-keys-backspace-or-tab-complet/1622315#1622315)

 [1]: https://opensource.apple.com/source/OpenSSH/OpenSSH-240.40.1/openssh/sftp-client.c.auto.html
