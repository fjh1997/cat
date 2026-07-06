---
title: Edge浏览器浏览mybank.icbc.com.cn自动跳转ie模式的原因分析
abbrlink: 21648
url: /posts/21648.html
date: 2023-05-14 17:57:37
tags:
---

经过抓包发现，mybank.icbc.com.cn该网站还没有发送请求数据包的时候，请求数据包里就已经有user-agent兼容模式相关设置。
![在这里插入图片描述](/images/c41ec15c3acb290cd493db44e5577662.png)

换了无痕模式依然是这样，且组策略里面没有配置，怀疑是edge内置的列表。
打开edge://compat/enterprise可以看到有一个消费者网站列表。在该列表里面查到了https://mybank.icbc.com.cn。
![在这里插入图片描述](/images/280aa755b6f5e77b40e0b796ce2eaf7e.png)
网站管理者可以通过这个来将他们的网站添加到消费者列表里：https://learn.microsoft.com/en-us/deployedge/edge-ie-mode-cloud-site-list-mgmt
