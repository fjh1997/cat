---
title: 无需vsphere vcenter直接使用ovftool从ovf 模版tamplate部署 虚拟机
abbrlink: 17418
date: 2021-01-21 13:45:55
tags:
---

有些时候安装了exsi但是没有vcenter客户端，从ovf模版里面创建虚拟机就很麻烦（因为vcenter太大了，如果从网页上传ovf又太慢了），这里介绍一个简单的办法
首先去官网下载最新的ovftool，保存为是bundle，bundle是linux下的安装文件，相当于widows的msi和macos的dmg
https://code.vmware.com/web/tool/4.4.0/ovf

```bash
 chmod +x /export/isos/VMware/6.0/VMware-ovftool-4.1.0-2459827-lin.x86_64.bundle   
 sh /export/isos/VMware/6.0/VMware-ovftool-4.1.0-2459827-lin.x86_64.bundle #执行bundle文件来安装ovftool，会安装到/usr/lib/vmware-ovftool/* 目录下
 mkdir /tmp/ovf
 mkdir /tmp/ovf/tools
 mkdir /tmp/ovf/files #创建临时目录
 rsync -au /usr/lib/vmware-ovftool/* /tmp/ovf/tools/
 #把安装好的ovftool复制到临时目录
 sed -i 's/bash/sh/' /tmp/ovf/tools/ovftool #因为exsi里面不支持bash，所以要把ovftool里面的bash替换为sh
 cd /tmp
 tar cf vmware-ovftools.tar ovf
 gzip -9 vmware-ovftools.tar #打包完毕

```
把tar上传到开启ssh的exsi里面
```bash
tar -xzvf /vmfs/volumes/datastore1/vmware-ovftool.tar.gz -C /vmfs/volumes/datastore1/#解压

/vmfs/volumes/datastore1/vmware-ovftool/ovftool   --noSSLVerify --allowExtraConfig --acceptAllEulas --name=win10 --datast
ore=datastore1 --vmFolder=win10 /vmfs/volumes/5fdb78ad-828522fc-fa23-70b5e842118
4/template/Win10-C1.ovf "vi://root:HelloWorld123@127.0.0.1:443"
#使用这个命令部署，由于ovf在exsi自己的目录下，所以就不用上传了，就比较快。
```
参考：
https://www.virtuallyghetto.com/2012/05/how-to-deploy-ovfova-in-esxi-shell.html
https://code.vmware.com/web/tool/4.4.0/ovf
https://github.com/richardatlateralblast/ottar
