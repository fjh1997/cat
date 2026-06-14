---
title: 解决winstore下载mincraft 出现错误提示的问题，以及minecraft.exe出现此应用无法在你的电脑上运行的原因分析。
abbrlink: 28525
url: /posts/28525.html
date: 2023-05-09 18:53:08
tags:
---


mincraft 点开显示此应用无法在你的电脑上运行，去C:\XboxGames\Minecraft Launcher\Content下看了下：
![在这里插入图片描述](/images/e34af21b09c8b0bb5cfd4b257fc868b2.png)
但是别人电脑上相同目录下一样的文件能运行，于是选择重装，但是刚开始下载就遇到这个问题：
商店提示这个
![在这里插入图片描述](/images/61cb0c9982f269c07475f6ae9b6c6a59.png)

点开一看是0x80070005，去网上查了下是权限错误，E_ACCESSDENIED

![在这里插入图片描述](/images/de3b3103691e0bb555e36c221253100f.png)
用windbg看了下，发现没有Access Denied的错误，只有一些rpc的错误。猜测是别的进程负责读取那个文件。

开process monitor过滤掉无关进程发现确实有一个进程是Access Denied。这个进程是GamingServices.exe,访问c:\.GamingRoot
![在这里插入图片描述](/images/4209a52606a825ecaae11e87165d0b2a.png)
去c:\.GamingRoot看了看权限，发现权限无法显示于是把别人电脑上的权限搬过来。
之后果然能够开始下载了，但是又发生别的错误0x8007139F：

![在这里插入图片描述](/images/ac9ef4837588c0ef5551abf1f679861f.png)
网上查不到相关的错误代码，于是跑去原来的目录C:\XboxGames\Minecraft Launcher\Content看了看发现程序重装了但还是程序无法运行。
然后去别人的电脑上看了下相同程序，发现别人电脑上的minecraft.exe不可读，不能复制，即使提权到NT authority\system也不能。看了下权限，发现我虽然是Administrators组的，但是按钮还是灰的不可选。但是删除是可以的。
![在这里插入图片描述](/images/dcc60676bf0e03b3a14624c11c8bdf43.png)


于是进入安全模式下把这个文件复制出来，检查哈希值发现和我的电脑上的是一样的，然后二进制编辑器打开发现不是标准的PE头。
![在这里插入图片描述](/images/0ea67b78d6d1a34ffba637a73f5a2f92.png)

最后删掉整个文件夹之后重装就好了。
通过比较能启动的游戏文件和不能启动的文件，发现文件数据一模一样，都不是PE格式，看起来抖有加密。

通过火绒剑提取出来程序文件可以执行，但程序文件数据和原文件不一样（虽然大小一样），是标准PE格式。

![在这里插入图片描述](/images/d4bf00174d34fe3591bec61773cbb5a9.png)
然后怀疑不一样的地方在NFTS 的MFT记录里面，于是用Active Disk Editor把两个文件的MFT记录导出来比对下发现：
![在这里插入图片描述](/images/289fdae1ee3437b5e3b1c3d98f12ce76.png)
能执行程序的文件的MFT记录里面末尾多了一大截数据。于是上Active Disk Editor查看发现

![在这里插入图片描述](/images/b5be84f6b8bb6a209c0877d0e6e339a4.png)
里面最后一个Attribute有KERNEL.GAMING.ENCRYPTED字样，看起来与程序加密有关。
网上查了下这个$EA ,发现它的全程是 kernel extended attribute ，内核扩展属性， 而且与cve-2021-31956有关。
这应该能解释为什么文件加密也能执行的问题以及奇怪的权限问题。
看来是创建这个文件的时候系统有设置，于是用process monitor再次看了下，果然：
![在这里插入图片描述](/images/0121ac12f3439c98be5d6a10c281ceaf.png)
系统执行了SetSecurityFile，设置扩展属性的[SetEAFile](https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/fltkernel/nf-fltkernel-fltseteafile)，WriteFile这几个操作，再加上时不时GamingServices.exe穿插进来，可以猜测是GamingServices.exe用ALPC等协议调用了system来完成上述一系列操作。
