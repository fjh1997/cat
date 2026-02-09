---
title: 一次破解TP-Link WAR308路由器的经历(2)
abbrlink: 18239
date: 2021-03-14 22:29:04
tags:
---

> 转载地址：https://herowong.org/archives/a-special-experience-of-hacking-tplink-router.html

说是破解其实也没有这么夸张啦,也就意外拿到了root密码.

先来说说背景吧,最初想要在公司的核心路由器上添加静态路由规则,通过IP地址段来判定网络出口,本来公司人就不多,当初就让熟人做一个套TP-Link的方案,核心路由用的是TP-R4239G


![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/fced71c30760ee30e4711a15d20b021c.png)

小型企业的路由器,管理界面都是tplink自己定制过的,恶心的要死,在后台Web管理界面只能手动一条一条增加,最多限制20条静态路由规则.20条明显不够用啊,APNIC中查出来的中国IP段都有7000多条了,哈哈,知道我要干嘛了吧

这个一看就知道肯定是有一个配置文件设置的,只要修改这个配置文件,再重启一下路由启就好了,但是这种tplink的路由器定制的系统,又没有开ssh端口,实在不好修改配置文件,要是能给刷上Openwrt之类的就好了,但是去官网上查了一下,Openwrt根本没有支持这个型号的路由.这个就没有办法了吗…想起原来有在tplink的官网上下载过升级的固件,是不是可以把官网的固件里的文件修改一下,然后刷到路由器上好像就可以了!!

于是乎,固件下载下来是一个压缩包,解压得到一个.bin的升级文件,在windows上居然可以用7zip打开,再从.bin文件解压出来,内藏玄机啊.越看越眼熟,看起来就是linux的目录结构


![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/4b31dd0416f696f6f5a8ab8d321c98c5.png)

再去etc目录一看,居然用的是openwrt!!多么神奇呀..tplink的路由居然原生用的是openwrt的系统.

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/3f47e6f08917ef9ebea28738a243df6a.png)
这下就好办多了,整个文件目录搜索一下static_routing,发现配置位置/etc/profile.d/profile ,有一行配置

```bash
config static_routing
option rule_max ’20’
```

修改成5000,打回升级包,在在路由管理界面固件升级一下就可以了….但是…并没有那么简单..因为.bin的升级固件是不能修改的..所以得把解压出来的文件重新打包回去,google了一圈,找到了一个叫 [binwalk](https://github.com/devttys0/binwalk) 的项目,专门用来分析路由固件的,可以在linux上解压固件文件,但是没有打包的功能,发现有另外的工具 firmware-mod-kit 不过已经好久没有更新了,因为原来是在codegoogle上的, 建议用一个这个项目 [firmware-analysis-toolkit](https://github.com/mirror/firmware-mod-kit) , 不过问题不大,clone到linux下编译一下,运行unsquashfs_all.sh 解压固件包,修改文件,然后用build-firmware.sh再打包,完成之后把打好的包上传到路由升级页面测试升级一下…发现升级不成功,检验升级固件没有通过,现在是在打包这里出了问题.

但是找到了 [这篇文章](http://iytc.net/wordpress/?p=1757) ,尝试着用他说的方法用他写的rom.sh重新打一下包,打包成功之后,正准备用新包升级固件,看到了这个界面


![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/42a68cb0fb2d686081f583cbed0d9a5e.png)

如果升级变砖了的话.那不是大家都不用上网了….我还是先备份一下配置先吧.虽然变砖了备份配置也没有什么用…备份得出来也是一个.bin的文件..解压出来一看,居然得所有系统的配置文件都备份出来了..这样的话..修改备份出来的配置文件然后重新导入配置的话不是就会覆盖原来的配置了?这都被我发现了…我注意到备份出来的配置文件包含了几个重要的文件

/etc/profile.d/profile    #前面说过了,这个是修改静态路由限制的

/etc/config/dropbear   #这个是openwrt用来管理ssh登录的

/etc/passwd 和 /etc/shadow  #你说惨不惨…这两个文件都能被覆盖..这个算是一个漏洞了吧…

那现在想要的就不单单是修改一下路由器的配置这么简单了,必然是取得路由器的root权限了.先来看/etc/config/dropbear 文件

```bash
config dropbear
option PasswordAuth ‘on’
option RootPasswordAuth ‘on’
option Port         ‘33400’
option ssh_port_switch         ‘off’
# option BannerFile   ‘/etc/banner’
```

可以看到,默认的端口33400,但是没有打开,把off修改为on就可以,然后在到/etc/shadow,把root的密码修改为123456对应的密文,然后把修改过的文件回写到备份出来 的.bin的配置文件包里去,注意哦,这个备份出来的.bin文件是可以进行修改的,直接用7zip把原来的文件覆盖然后确认修改就好了.好了,现在导入刚才修改过的配置,一会路由器会重启,重启完成之前,用ssh去登录路由的33400端口,端口是已经打开了..好鸡冻..输入密码123456…居然密码错误…

反复多次修改/etc/shadow下root的密码密文..一直显示密码错误..root密码居然修改不了了?不让修改密码,那我加一个用户总可以吧….在/etc/passwd加一个与root同组的用户hero,在/etc/shadow 加上这个用户的密码密文,导入之后再登录..居然登录成功了…这是什么鬼..虽然新建的用户与root同组,但是很多的程序和文件的权限都是root用户才有,而且openwrt默认是不安装有sudo的..用opkg安装软件包也是需要root权限才可以.难道只让我用一个低权限的用户了吗..

再去官网查了一个dropbear 的配置,发现官方是没有ssh_port_switch这个配置项的(而且命名规则都不一样…..),猜测就是tplink定制的时候加上的.再次对整个固件搜索ssh_port_switch字段,发现在/etc/init.d/dropbear里有.这里就不用多说了吧…简单看一下这个启动脚本,发现两个与官方原版的脚本不同的地方,一个是增加了启动前检查ssh_port_switch配置开关,还有一个居然是启动后重新配置root密码…………….


![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/ae80e1a39e2f90179595eb9afdf32392.png)

这样的话,每次用root用户运行dropbear脚本时,root的密码都会被重置..也就是说,路由器每次重启的时候root密码都会重置….怪不得修改/etc/shadow里的密文都不生效.再来看看这个root密码是怎么生成的


![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/3471326a016741573b2bf5384695ff2b.png)

既然密码都是根据各种硬件号来生成的,就直接在当前用户下重新执行一下getNewPasswd里的那几条代码,root密码就出来了…..测试一下,登录成功…..

在成功用root登录后尝试修改/etc/init.d/dropbear脚本,把重置密码的代码注释掉,发现重启路由器后代码又被还原,猜测在重新路由器时会对所有的启动脚本进行重置覆盖,具体是从哪里覆盖过来的..我也懒得找了

至此,已经拿到路由器root密码

再说两点

这个路由器的静态路由规则的配置文件在 /etc/config/static_route

修改这个文件之后路由规则好像是立即生效的,但是不知道为什么有些时候会重新去load这个路由规则,如果有2000+条规则那得重启好久….(嗯是的…)

推荐一个项目 [bestroutetb](https://github.com/ashi009/bestroutetb) 用来生成路由规则的 ,这里有这位小哥写的 [算法解释](http://ashi009.tumblr.com/post/36581070478/%E7%BF%BB%E5%A2%99-vpn-%E6%9C%AC%E5%9C%B0%E8%B7%AF%E7%94%B1%E8%A1%A8%E7%9A%84%E4%BC%98%E5%8C%96) (在tumblr上)

后来的事情我不多说了:D

参考:

[斐讯K2的FLASH分区图及ROM固件提取、修改及打包](http://iytc.net/wordpress/?p=1757)

[路由器逆向分析——firmware-mod-kit工具安装和使用说明](http://blog.csdn.net/qq1084283172/article/details/68061957)

[本地路由表的优化](http://ashi009.tumblr.com/post/36581070478/%E7%BF%BB%E5%A2%99-vpn-%E6%9C%AC%E5%9C%B0%E8%B7%AF%E7%94%B1%E8%A1%A8%E7%9A%84%E4%BC%98%E5%8C%96)

> SHAKA 2017-08-01 at 11:20 我老公真帅！
> 
> MILES 2017-09-27 at 12:07 你好大神，在步骤”项目 firmware-analysis-toolkit ,
> 不过问题不大,clone到linux下编译一下,运行unsquashfs_all.sh”，克隆下来的项目变异完并没有unsquashfs_all.sh，但是firmware-mod-kit编译完有这个，尝试直接解包tp官网的bin文件一直失败。请问是我解包工具不对，还是官网的bin要做什么处理才能解包，多谢。
> 
> HEROWONG 2017-10-17 at 14:17
> sorry..好久没上来看,这个有什么报错的吗?在PC用7zip可以解压bin包吗?有可能是包下载下来的时候有损坏,重新下载试试
> 
> ISNULL 2018-05-11 at 13:55 请教试密码是采用的哪种方式
> 
> HEROWONG 2018-07-31 at 20:24
> 首先想办法创建一个用户并且ssh登录上,文章中有提到,然后找到/etc/init.d/dropbear文件里看到getnewpasswd函数,复制里面的代码在cli上执行就能得出密码了,看上去是用mac地址和一些其它的参数生成的

