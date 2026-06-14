---
title: 一次破解TP-Link WAR308路由器的经历
abbrlink: 26372
url: /posts/26372.html
date: 2021-03-14 22:20:16
tags:
---

> 转载地址：https://www.eatm.app/archives/395.html

tp-link路由器破解/SSH登录/root权限
此方法仅适用较新款的路由器.导出的备份配置能够使用7z打开,且基于系统openwrt二次开发的系统.
 

从路由中备份备份配置信息
使用7z解压出文件

开启SSH-如果路由中有’开启调试’选项,勾选即可,即为开启SSH登录

```bash
#修改文件userconfig/etc/config/dropbear,
#查看option ssh_port_switch值，修改为'on'
#如果已经为'on'则无需修改
config dropbear
option PasswordAuth 'on'
option RootPasswordAuth 'on'
option Port '34000'
option ssh_port_switch 'on'
#记下option Port端口号--这是SSH连接端口号
```

 

添加新用户

```bash
#文件:/etc/passwd
#复制1行root
root:x:0:0:root:/root:/bin/ash
#并修改名字
myname:x:0:0:myname:/root:/bin/ash
```

 

设置密码

```bash
#文件:/etc/shadow
添加1行
myname:$1$12345678$0YZqMCdlfK6hUgWzHk5mQ1:17703:0:99999:7:::
#这个密码是qwe123
#你也可以在linux下利用以下代码自己生成密码
perl -e 'print crypt("123456","\$1\$aaaabbbb\$") . "\n"'
#123456为密码,成功后将输出加密后的密码
```

 

将修改过的文件替换到压缩包中去(win7+系统可能需要将原始的bin文件解锁-文件属性解锁)
路由中导入配置信息-重启-完成…
使用IP:前面看到的端口,myname,qwe123登录ssh了,
我这登录上去后不知道什么原因,登录上后直接为root
登录上去如果不是root的,需要如下操作

 

获取root密码

```bash
#如果TP-LINK在密码规则没改变的情况下，可以使用以下命令取得root密码
echo -n "xxxxxxxxxxxx" | md5sum
#xxxx为路由器LAN口中显示的的MAC地址-大写，不要连接符号12位
#执行后返回一串32位字符串,前8位为root密码
#如果不正确，看下面
#文件/etc/init.d/dropbear
#复制文件
cp /etc/init.d/dropbear /etc/init.d/getpwd
#修改文件
vim /etc/init.d/getpwd
#getNewPasswd函数下面的部分可以全删掉
在getNewPasswd函数下面添加一行代码
getNewPasswd
#保存退出.
#执行脚本
/etc/init.d/getpwd start
#将显示root密码
```

 

顺便看一下路由器的硬件信息:

```bash
root@TP-LINK:~# cat /proc/cpuinfo
system type : Qualcomm Atheros QCA956X rev 0
machine : TP-LINK TL-WVR1300G　　#他这连名字都懒得改了-我这型号是TL-WAR1200L
processor : 0
cpu model : MIPS 74Kc V5.0
BogoMIPS : 385.84
wait instruction : yes
microsecond timers : yes
tlb_entries : 32
extra interrupt vector : yes
hardware watchpoint : yes, count: 4, address/irw mask: [0x0000, 0x0ff8, 0x0ff8, 0x0ff8]
ASEs implemented : mips16 dsp
shadow register sets : 1
kscratch registers : 0
core : 0
VCED exceptions : not available
VCEI exceptions : not available
root@TP-LINK:~# cat /proc/meminfo
MemTotal: 126464 kB
MemFree: 20032 kB
Buffers: 9316 kB
Cached: 35964 kB
SwapCached: 0 kB
Active: 37528 kB
Inactive: 20896 kB
Active(anon): 15876 kB
Inactive(anon): 3112 kB
Active(file): 21652 kB
Inactive(file): 17784 kB
Unevictable: 0 kB
Mlocked: 0 kB
SwapTotal: 0 kB
SwapFree: 0 kB
Dirty: 0 kB
Writeback: 0 kB
AnonPages: 13160 kB
Mapped: 6328 kB
Shmem: 5844 kB
Slab: 33148 kB
SReclaimable: 3552 kB
SUnreclaim: 29596 kB
KernelStack: 1504 kB
PageTables: 712 kB
NFS_Unstable: 0 kB
Bounce: 0 kB
WritebackTmp: 0 kB
CommitLimit: 63232 kB
Committed_AS: 53864 kB
VmallocTotal: 1048372 kB
VmallocUsed: 1780 kB
VmallocChunk: 1022756 kB
 
```

参考:

https://herowong.me/archives/a-special-experience-of-hacking-tplink-router.html
https://blog.jcat.cn/?p=74
