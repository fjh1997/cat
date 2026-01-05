---
title: linux下使用steam++或steamcommunity302出现证书问题的解决方法之一
date: 2023-06-24 00:23:16
tags:
---



由于 Steam与服务器的通信使用两种通道，一种是steam登录的时候使用的原生组件采用的证书库与系统的一致，如果证书不在系统库里会卡在正在登陆状态。所以把证书重命名为crt后放入 /usr/local/share/ca-certificates然后运行update-ca-certificates即可。
而另一种是Steam 内嵌的浏览器与服务器的通信，如果证书不在信任库内，即使系统信任了证书，steam能登录也会无法使用steam浏览社区，报错Invalid SSL Certificate等信息。而steam使用 Chrome 内核浏览器，使用自管理证书库。
所以需要使用 Chrome 打开 设置 - 隐私设置和安全性 - 安全 - 管理证书
选择 授权机构( Authorities )
将证书文件重命名为pem导入，勾选信任该证书，以标识网站身份。


参考：
https://steampp.net/liunxSetupCer
https://www.dogfight360.com/blog/2319/
