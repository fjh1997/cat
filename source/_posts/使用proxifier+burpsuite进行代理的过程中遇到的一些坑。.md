---
title: 使用proxifier+burpsuite进行代理的过程中遇到的一些坑。
abbrlink: 1637
date: 2020-06-05 09:56:17
tags:
---

最近网易uu加速器送守望先锋，遇到了一堆阴兵(大雾)。
所谓阴兵就是使用一些秒杀工具运行后台脚本。虽然我不是阴兵，但有点好奇阴兵们是怎么找接口的。就拿uu加速器做了实验。
首先打开burpsuite，安装证书什么的没话说，开放了本地的8080作为监听端口。
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/0c57bae5c9a65579bcd040e6d31b62fb.jpeg)
然后proxifier设置规则进行代理。
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/c902b14b06e0b062da50a5b868507b6f.jpeg)
然后我满怀期待的进行抓包，结果遇到问题了。
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/f36c63f4d082f5e0ed11efae09e4054e.jpeg)
提示失败，然后我检查了一下proxifier，发现包发不出去。
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/6a5f1e05fd6b7f61bad092afe47aadd8.jpeg)
再检查下wireshark，发现burp收到proxyfier给他的封装成http发往8674的代理包之后就不理了。
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/6ca8138a2cb13480740fa0abd504ceb2.jpeg)
这种http代理的原理是，直接的http请求就直接发给代理端口，非http请求如tls或者tcp就封装成http包发给代理端口，如上图所示，burp在收到代理包之后应该往8764发送tcp流量，然而，burp并没有发，如下图，并没有找到。
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/51e926e09a74f983a16b5224feaa77ea.jpeg)
所以burp的代理真垃圾。
解决方法是再加一个规则，注意这个规则在proxifier里面要排序在any通配规则的上面，把8764直接direct，不经过代理即可。
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/095dfca49b44ea150fdf7e51d3cc4094.jpeg)
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/d3395258916dcc4f94cb5f07f93afc2b.jpeg)
之后burp就能正常抓包了，不然那个tcp流量发不出去，后面的http流量就没了。
