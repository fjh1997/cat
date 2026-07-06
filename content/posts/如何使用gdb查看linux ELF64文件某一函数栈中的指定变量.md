---
title: 如何使用gdb查看linux ELF64文件某一函数栈中的指定变量
abbrlink: 47092
url: /posts/47092.html
date: 2019-12-24 12:55:41
tags:
---

在NJUPT2019 ctf比赛过程中我遇到这样一题。

> <p>==Difficulty: easy==<br><br>flag格式NCTF{.*}<br><br>此题单纯考察调试<br><br>flag一调就出哦~~~<br><br>==Author QQ: 1403517540==</p>

这题目一看很简单就一个名为debug的文件，用ida pro打开看看。
![在这里插入图片描述](/images/7fedf4338d5a42a06c878b3c868495bd.png)
找到关键代码，就是把输入的flag和一个名为\*s的指针执向的字符串进行比较，然后比较成功就显示flag正确。
检查了一下\*s的内存位置。
![在这里插入图片描述](/images/00852b12ae0575675db3ea74878d6234.png)
发现它在main函数里面，偏移位是-210H，那么接下来我们用gdb来调试这个程序。
![在这里插入图片描述](/images/6fd9529d00baf61154fc3022463eb91d.png)
等到程序要求我们输入flag的时候按下ctrl+c给予程序中断信号，然后gdb就会进入控制模式，我们可以在这里输入命令查看栈信息。
![在这里插入图片描述](/images/647a4a0436e1134cc370a6c87d20c470.png)
输入backtrace（简写bt）可以打印函数到目前为止调用的栈。
![在这里插入图片描述](/images/29337a7d2f76278a0001b6dc4424549a.png)
可以看到__libc_start_main函数所在栈帧是6
注意到其中，main=0x555555554ae6，这个就是我们main函数的基址，很多同学问为什么要这么做，实际上，在linux里面执行main函数的时候是由__libc_start_main来执行的（甚至main函数没有一个独立的栈帧，是和__libc_start_main共享的），因此要找到main函数的栈基址，就要把断点设置在main函数这里，然后查看esp的内容
![在这里插入图片描述](/images/0b1c3f1afa968aa1757d8a1ffcb28d7b.png)
输入 b *0x555555554ae6设置断点
然后再输入run，让程序重新运行。
重新运行就会断点断在main函数开头，此时输入info r查看寄存器的值
![在这里插入图片描述](/images/329bf759a83b96cf0d285f513822803e.png)
可以看到rsp的值是0x7fffffffe168，同时结合ida pro里面的汇编代码可以判断，0x555555554ae6存放的是push rbp命令。
```asm
sub esp 8
mov [esp] rbp
```
那么这个0x7fffffffe168值是存储rbp的地址加上8，那么就可以得到rbp的地址是0x7fffffffe160，对应ida里面的偏移0
![在这里插入图片描述](/images/069d0fe0c1a92c7a18dda654bd7b1b80.png)
加上之前得到的变量地址偏移是-210H，那么我们可以判断flag藏在0x7fffffffe160-210的位置也就是0x7FFFFFFFDF50
此时输入c，让程序恢复运行，在要输入flag的时候继续按ctrl+C中断，然后输入tele 0x7FFFFFFFDF50就可以得到flag。
此时再输入c，把程序恢复运行，输入你刚才得到的flag就可以验证是否正确。
![在这里插入图片描述](/images/1840a6a9a50ae371891f2d0e9911c551.png)
![在这里插入图片描述](/images/e717ad161d3749ed1675c6c961ff86bb.png)
当然，这样看main函数的地址其实还是有点麻烦，更简单的办法是info file命令
![在这里插入图片描述](/images/54a2f2dc87e0a3b5fb9de1a1c5cd6ccf.png)
我们可以看到这里面entrypoint的值是0x5555555546f0
这个段号就是对应ida里面的.text段的开头
![在这里插入图片描述](/images/c3712352031493c402afe2663bfd71b1.png)
此时可以算出偏移为0x555555554000然后后面的代码只要加上偏移地址即可。
