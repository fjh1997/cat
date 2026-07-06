---
title: 512-rear chassis fan not detected的解决方法
abbrlink: 32580
url: /posts/32580.html
date: 2021-11-19 19:44:15
tags:
---

家里有台老电脑，一开机就提示这个，以为是风扇的问题。就去淘宝上买了个3pin的风扇，结果还是提示这个，后来检查了一下，发现这个风扇是，白，红，黑三条线的，不能调整风扇速度，所以要买黄，红，黑三条线能调节速度的风扇才行。

但是能调节速度的风扇买来之后发现功率很大。费电。于是想干脆不用风扇。
但是去bios里面找了半天也没找到关掉风扇检查的地方。
之后在这里找到了解决方法。
https://titanwolf.org/Network/Articles/Article?AID=45ca1ef1-04f7-44a5-9bd7-405a25914813
就是进入Thermal里面可以查看风扇速度，虽然一开始没有关闭选项，但是在下图这个没进入的地方连着按三个键ctrl+A+f10，之后再按回车进入即可激活隐藏选项
![在这里插入图片描述](/images/31ccd1df594b0849eb87bfdfd0cc94ba.jpeg)
![在这里插入图片描述](/images/f37c3ab3813895511295ffb172ce9bc4.jpeg)


隐藏的两个选项出来之后就把 System Fan Check关掉就行了。
