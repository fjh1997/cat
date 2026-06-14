---
title: 如何导出windows平台下cloudflare warp内部存的私钥和token
abbrlink: 9157
url: /posts/9157.html
date: 2023-05-07 23:05:01
tags:
---

结论：管理员身份运行
mimikatz：https://github.com/gentilkiwi/mimikatz/releases/tag/2.2.0-20220919

然后输入： privilege::debug （提升权限到：NT-AUTHORITY\SYSTEM）以及sekurlsa::credman 就能看到：

![在这里插入图片描述](/images/e3a37cdfb52aeeca5eb4414797db2a1a.png#pic_center)

发现过程：
cloudflare warp.exe本身是通过有名管道和warp-svc.exe通信，通过[IO ninja](https://ioninja.com/)的pipe monitor排除了管道通信中传输私钥和token的可能。

而使用`warp-cli  rotate-keys` 替换密钥的时候，私钥公钥会存在本地，同时向服务器地址api.cloudflareclient.com发送公钥和token以及设备id来注册公钥。之后使用私钥通信。

替换密钥的时用process monitor 发现lsass.exe往
C:\Windows\System32\config\systemprofile\AppData\Roaming\Microsoft\Credentials\52F014FB686518D3591F1876ADAAEA09这个文件里
写入了东西（当然，右键排除了很多进程，过滤了很多注册表活动。），而daemon本身warp-svc.exe没写入东西。
![在这里插入图片描述](/images/8f66d14a309748e88e816341337b7f97.png)
猜想是warp-svc.exe调用lsass.exe写入这个文件。因为调用的协议是ALPC（Advanced Local Procedure Calls ），在warp-svc.exe的某个dll中实现，所以process monitor没有捕获到。之后使用ls和dir这个文件返回没有这个文件，但cat却可以读，想起来windows的权限确实很古怪，有时候会存在有列出文件目录的权限但没有读取文件的权限的情况。
![在这里插入图片描述](/images/c78cec861ca4339ed8bbf35726663e82.png)
网上查了一下这个文件所在目录很少提到。 但是有个目录是C:\Users\Userrofile]\AppData\Roaming\Microsoft\Credentials 可以用控制面板的凭据管理器credman来读取。目录对比下可以猜到不同的权限运行credman会有不同的结果而mimikatz恰好可以用system权限运行凭据管理器。
