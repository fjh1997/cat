---
title: 从VMware迁移到Hyper-V教程
date: 2019-09-26 20:21:35
tags:
---

# 从VMware迁移到Hyper-V教程
由于系统的主要组成部分是在硬盘里，所以我们迁移的主要工作是硬盘转换。步骤如下：
## 1.下载安装Microsoft Virtual Machine Converter 
 https://www.microsoft.com/en-us/download/details.aspx?id=42497
## 2.启动powershell-ISE

输入命令来转换VMDK到VHDK（里面需要改成你自己的软件安装地址和虚拟机硬盘地址）
我的软件安装路径是C:\Program Files\Microsoft Virtual Machine Converter\
需要转化的VMDK是 D:\kali\kali.vmdk，目标目录是E:\Converted
```cmd
PS C:\Users\Administrator> Import-Module 'C:\Program Files\Microsoft Virtual Machine Converter\MvmcCmdlet.psd1'
PS C:\Users\Administrator> ConvertTo-MvmcVirtualHardDisk -SourceLiteralPath D:\kali\kali.vmdk -VhdType DynamicHardDisk -VhdFormat Vhdx -DestinationLiteralPath E:\Converted
```

如果你出现了类似

> The entry 2 is not a supported disk database entry for the descriptor.

的报错，请下载工具https://communities.vmware.com/thread/343214?start=0&tstart=0

放到同一目录下使用命令：
```cmd
PS C:\Users\Administrator> dsfo.exe "D:\kali\kali.vmdk" 512 1024 descriptor1.txt
```
将输出文件里面的"InstallType"注释掉
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/88586c4055a028ea7bcd7f36251a3005.png)
然后再次使用命令,注意是dsfi不是dsfo
```cmd
PS C:\Users\Administrator> dsfi.exe "D:\kali\kali.vmdk" 512 1024 descriptor1.txt
```
之后重新执行转化命令即可，可以看到在转化硬盘
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/a247d731b2cf61845b3804dc37d298c5.png)
成功后应该可以看到转化好的文件
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/d3144518e10723201c08eac28e1658a7.png)
之后使用hyper-V管理器新建虚拟机并使用这个vhdk磁盘即可

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/1ca9db8fb2068dfd5e4eca14f6e666f8.png)
需要注意的是有些时候会出现系统无法启动的问题，这个时候要更改为正确的引导配置MBR或者EFI，
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/3723b7a629ba4355c65d135b2ffa71e7.png)
前一个是MBR，后一个是EFI，需要正确配置才行,还需要注意的是，有些快照的内容无法通过这个来转换，这个只能转换第一个快照。
