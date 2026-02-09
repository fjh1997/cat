---
title: 解决搭建windows pwn和linux pwn下遇到的不回显问题
abbrlink: 55703
date: 2020-03-23 13:28:29
tags:
---

最近给学员出题，windows的pwn和linux的pwn，linux下面使用xinetd，windows下面则使用Ex师傅的win_server即可。[项目地址](https://github.com/Ex-Origin/win_server)
然而我遇到了个问题，就是我nc连上我的题目之后，那个“请输入密码”的提示文字一直没出来，等了半天也不行。
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/9cb29a27586eb6b02fb94967faa9beec.png)
直到我输入了个回车，然后“请输入密码:”的文字才跳出来，但同时登录失败也跳了出来，这让我没法输入密码。
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/9102a4a1858b33770acb1557997cccfe.png)
之后我查询了资料得知，这个是缓冲区但问题，要在编写但pwn程序里面设置缓冲区为0之后重新编译才行，就解决了。

```c
setbuf(stdout,0);
setbuf(stdin,0);
```
有的师傅说这样设置也行，我没试过，你们可以试试：

```c
setvbuf(stdin,0,1,0);
tvbuf(stdout,0,2,0);
```
关于windows pwn环境搭建，发现ncat也能拿来搭建：
比如下面这个命令是在1005端口监听，添加--keep-open是为了针对每一个会话另起一个cmd的shell。这里的cmd可以换成你自己的程序。
```bash
ncat -l 1005 --keep-open  -e cmd
```
输出错误重定向：
```bash
ncat -l 127.0.0.1 1005 --keep-open  --sh-exec "cmd 2>&1"
```
