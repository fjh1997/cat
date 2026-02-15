---
title: dell optiplex 7090 ssf 注入intel i219 网卡驱动安装exsi 7.0.2
abbrlink: 29248
date: 2021-12-21 19:40:00
tags:
---

exsi 7.0.2 VMware-ESXi-7.0U2a-17867351-depot.zip：
https://mhsj.net/217.html

网卡驱动 Net-Community-Driver_1.2.2.0-1vmw.700.1.0.15843807_18835109.zip：https://flings.vmware.com/community-networking-driver-for-esxi
```powershell
Install-PackageProvider -Name NuGet -Force
Install-Module VMware.PowerCLI -Scope CurrentUser -Proxy "http://192.1.1.112:7890"
set-executionpolicy remotesigned
Import-Module VMware.ImageBuilder
Add-EsxSoftwareDepot '.\VMware-ESXi-7.0U2a-17867351-depot.zip'
Add-EsxSoftwareDepot '.\Net-Community-Driver_1.2.2.0-1vmw.700.1.0.15843807_18835109.zip'
New-EsxImageProfile -CloneProfile "ESXi-7.0U2a-17867351-standard" -name "ESXi-7.0.2-NUC" -Vendor "kangyuzhe"
add-EsxSoftwarePackage -ImageProfile "ESXi-7.0.2-NUC" -SoftwarePackage "net-community"
Export-ESXImageProfile -ImageProfile "ESXi-7.0.2-NUC" -ExportToISO -filepath ESXi-7.0.2-kangyuzhe-NUC.iso
 
```
还有记得在bios里记得把raid关了。sata改成achi。

不然就算exsi装好了也没法用硬盘。
如果要让exsi支持raid，去这里面找找驱动：
https://customerconnect.vmware.com/downloads/details?downloadGroup=ADDON_ESXI70U2_DELLEMC&productId=974，
用相同方法打到iso里安装。或者装好后安装驱动。
根据这个：https://www.dell.com/support/kbdoc/en-us/000181689/dellemc-esxi-7-0-quick-boot-compatibility-guide
驱动可能是这个：博通的raid用的lsi_mr3。

https://customerconnect.vmware.com/en/downloads/details?downloadGroup=DT-ESXI70-BROADCOM-LSI_MR3-77190200-1OEM&productId=974


参考：
https://www.virten.net/2021/03/esxi-7-0-update-2-on-intel-nuc/
https://docs.vmware.com/en/VMware-vSphere/7.0/com.vmware.esxi.install.doc/GUID-B2F3A45B-C61E-48FF-808D-17AD2C2F1754.html
