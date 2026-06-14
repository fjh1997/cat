---
title: 解决vscode的terminal乱码
abbrlink: 45987
url: /posts/45987.html
date: 2019-11-09 10:08:12
tags:
---

![在这里插入图片描述](/images/d57a907dd1e1768a72f70ad01a0ce822.png)
![在这里插入图片描述](/images/26f55512df87047b9e08ca342d2e0afc.png)
![在这里插入图片描述](/images/a61a32332da275ec45190250c07aaaa7.png)
编辑并在json里面插入
```json
"terminal.integrated.shellArgs.windows": ["-NoExit", "chcp 65001"],
```
这样可以确保powershell不乱码，如果是cmd的话可以用这个
```json
 "terminal.integrated.shellArgs.windows": ["/K chcp 65001 >nul"],
```
之后打开新终端测试即可。不过这个方法会导致debug出现问题，慎用。
最好的方法还是安装最新版powershell并配置
https://github.com/PowerShell/PowerShell/releases
![在这里插入图片描述](/images/4612175215d60e0cb927f252dd57a0e8.png)
![在这里插入图片描述](/images/057722049b72e0f3edbe4a4211b62dda.png)
![在这里插入图片描述](/images/981a9436da8b57d559a1c62b0269107a.png)
在这里打勾
