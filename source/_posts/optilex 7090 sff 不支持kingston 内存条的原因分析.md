---
title: optilex 7090 sff 不支持kingston 内存条的原因分析
date: 2021-11-24 14:21:09
tags:
---

可以去金士顿或者crucial官网查询该设备支持的内存型号，
https://www.kingston.com/czech/en/memory/search/model/103250/dell-alienware-optiplex-7090-tower-small-form-factor-sff

https://www.crucial.com/compatible-upgrade-for/dell/optiplex-7090-small-form-factor

发现都是1.2V的，但是买来的内存条虽然是金士顿的，但是是1.35V的，难怪开机不识别。


后面去dell官网看了下
https://www.dell.com/support/kbdoc/zh-cn/000132428/dell-optiplex-%e5%86%85%e5%ad%98-%e5%85%bc%e5%ae%b9%e6%80%a7%e6%8c%87%e5%8d%97
有一行小字，

> NOTE: Voltage
>DDR4 improved power efficiency over DDR3 and DDR3L memory technologies. Reducing DDR3L DRAM I/O voltage from 1.35 V used to 1.2 V.

说明ddr4的内存条默认设置为1.2V了。
那么为什么这条ddr4的内存条为1.35V呢？主要是用到了XMP技术，但是dell又恰恰不支持XMP技术。

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/05f663d3b1e404a9cfc34a3ce993bee0.jpeg#pic_center)
去查找了下手册：
https://www.kingstonmemoryshop.co.uk/image/product_pdf/kf436c18bb-32.pdf
发现KF436C18BB/16工作在两种电压下。1.35V是3600mhz或者3000mhz，1.2V则是2400mhz
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/b61c775310feee47d7cacc97508102ad.png)
而官网手册下
https://cdn.cnetcontent.com/syndication/mediaserverredirect/260b18954b3ad537b29bbbe19df8ee6f/original.pdf
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/e52d1ca0a7a7a32431533a090ffa01b4.png)
只支持2444，2933，3200这几种频率的内存，这样显然就不行了。
但是后来换了个HX426C16FB3K2/32是2666MHZ的，而且也是1.2V发现也不行
https://www.kingstonmemoryshop.co.uk/image/product_pdf/hx426c16fb3k2-32.pdf
发现带壳子的内存条都不行，估计就是XMP的问题，换个没有XMP的内存条应该就行。
