---
title: 220v插座led指示灯维修
date: 2023-11-07 22:03:44
tags:
---

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/496716b5ace12126c6fae7353a37f5c9.jpeg)
由于220v是交流电，有反向电压的情况，而led反向通电的时候电阻无穷大，所以分压也无穷大，220v一导通就击穿，即使加了很大的电阻也没用，串联电阻只能作用于二极管正向的时候。

目前有两种方案：
方案一：串联一个1N4007 整流二极管，这样可以避免反向电压，让反向电压全部分给1N4007 ，起到保护led的作用。缺点是功率较大，因为很多时候发热在大电阻上，
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/f5e36894a5d55aebcba700d11c969f89.png)

方案二：反向并联一个输出2.7v，功率1w的稳压二极管，同时串联一个规格为0.47uf耐压400v的X安规电容。这样可以让二极管在2.7下工作，较安全，缺点是电路复杂。


![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/3d8572326cd4e60d04a242524df2c9e9.png)
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/9cb4855e7406915b403de04a37a89aaf.jpeg#pic_center)

