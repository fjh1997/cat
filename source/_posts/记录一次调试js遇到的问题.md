---
title: 记录一次调试js遇到的问题
date: 2020-05-20 16:27:59
tags:
---

最近在逆向网鼎杯的时候遇到了这个问题，不知道怎么回事，记录一下，希望下次能解决。
我在函数*虚空悟*中想调用外部声明的函数*造化*以及变量*藏*，直接写在代码里面是没有问题的，确实能够访问。
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/615888a4173520e93bdb9d296e899eec.jpeg)
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/5febab79732a7cd734a0b8ba9b57ad0b.jpeg)
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/3a0e7c41297903d2b1658336f013f5ea.jpeg)
断点控制台里面能找到这两个外部变量。
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/794b4861d9fb879c6f7fa6d2cb31d9d4.jpeg)
但是假如注释掉那两个console.log,这个函数里面没有调用*造化*和变量*藏*，下断点在这里的时候控制台里面就提示找不到。
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/71f4eb96339f180535de77a938488542.jpeg)

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/a04b678258a13c5dcd46119eed168d96.jpeg)
下次调试就有经验了，如果要调试外部的变量，最好在里面引用一下，不然会无法在调试器里面访问，暂时不知道原因。
