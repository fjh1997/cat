---
title: element UI官网页头固定取消滚动条的实现方法
abbrlink: 4359
date: 2021-07-21 19:34:07
tags:
---

最近看了element-ui的官网感觉这个设计不错。
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/82543bc917d9c0975bf79162dfdede4a.png)
其中Aside可以滚动，Main区域可以滚动，Header区域不能滚动，且整个页面也不能滚动。
然后我自己写了个，结果发现惨不忍睹。
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/f0dc5f8e3efe7aeef762b2243fe12047.png#pic_center)

去网上查了下，stackoverflow上面说这种是控制overflow来实现取消滚动条的，然后我把官网body的overflow注释掉发现还是没有重新启用滚动条。
之后发现app这个div也有overflow-y的控制，再次取消，还是没有重新启用。
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/1f083e1854884174aa1d0c4e6432c4e9.png#pic_center)

之后联想到页头是使用的position:fix来固定的，所有尝试了下取消页头的position:fix
之后发现滚动条居然出现了！
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/f60c13e7da25547d6b104bf78105785e.png#pic_center)
前后对比如下，确实后面那种丑了很多。
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/ead315fa31b3d6be009e97cf6b17df99.png#pic_center)
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/85eb75ef846c880ecbbd5c77f1de65ac.png#pic_center)

所以我们要实现前面那种样式，使用逆向思维，按照取消的样式这几点设置即可。

