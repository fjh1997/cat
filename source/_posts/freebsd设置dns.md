---
title: freebsd设置dns
abbrlink: 17187
date: 2022-06-02 15:02:00
tags:
---

问题：

> $ ping www.baidu.com
ping: cannot resolve www.baidu.com: Host name lookup failure

初学者可能会去/etc/resolv.conf,但这个实际上是由resolconf生成的，而resolvconf是由local-unbound-setup生成的，所以更好的解决方式如下解决：
```
local-unbound-setup \
    10.0.40.1 \
    8.8.8.8 8.8.4.4 \
    208.67.222.222 208.67.220.220
```
参考：https://revprez.github.io/posts/2017-09-09-local_unbound-on-freebsd-11.html
