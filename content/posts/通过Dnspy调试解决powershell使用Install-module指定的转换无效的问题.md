---
title: 通过Dnspy调试解决powershell使用Install-module指定的转换无效的问题
abbrlink: 28048
url: /posts/28048.html
date: 2023-05-10 17:53:19
tags:
---


之前运行`Install-module -Name NtObjectManager`出现以下错误：

```bash
PackageManagement\Install-Package : Package 'NtObjectManager' failed to be installed because: 指定的转换无效。
At C:\Program Files\WindowsPowerShell\Modules\PowerShellGet\1.0.0.1\PSModule.psm1:1809 char:21
+ ...          $null = PackageManagement\Install-Package @PSBoundParameters
+                      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : InvalidResult: (NtObjectManager:String) [Install-Package], Exception
    + FullyQualifiedErrorId : Package '{0}' failed to be installed because: {1},Microsoft.PowerShell.PackageManagement.Cmdlets.InstallPackage
```
之后使用PackageManagement\Install-Package NtObjectManager直接安装
```bash
PackageManagement\Install-Package : Package 'NtObjectManager' failed to be installed because: 指定的转换无效。
所在位置 行:1 字符: 1
+ PackageManagement\Install-Package NtObjectManager
+ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : InvalidResult: (NtObjectManager:String) [Install-Package]，Exception
    + FullyQualifiedErrorId : Package '{0}' failed to be installed because: {1},Microsoft.PowerShell.PackageManagement
   .Cmdlets.InstallPackage
```
还是出错，但是别的电脑上没有问题。
于是用dnspy调试，附加到进程，调试发现有些局部变量显示不了提示：

> 当线程位于不安全状态时无法计算表达式。按步调试或运行直到触发断点。

看了这个[说明](https://github.com/dnSpy/dnSpy/wiki/Making-an-Image-Easier-to-Debug)，用管理员模式下的dnspy直接启动powershell.exe，之后就能显示局部变量了：

由于报错提示的是PackageManagement\Install-Package这个模块，去系统里看了下，确实有这个模块，在C:\Program Files (x86)\WindowsPowerShell\Modules\PackageManagement\1.0.0.1目录下。
看了下PackageManagement.psd1这个文件发现：
![在这里插入图片描述](/images/ee1a68a85d5aff0d589c25aa0607f8ec.png)
Install-Package在Microsoft.PackageManagement.dll这个文件里，用dnspy载入程序之后先break 暂停，然后在线程里面一个个选，就能通过栈帧的名字找到对应的线程。
![在这里插入图片描述](/images/2ba2e3249891e05e3f632dacc3a6adf7.png)


也可以先打开dll，在install-package函数下断点然后再启动程序。
![在这里插入图片描述](/images/e06249749e55f5abc6e1d55a3d6dc598.png)
一步步调试，中间会遇到类似invoke的函数，这个是另起新命令的线程了，不要跟进去，可以通过powershell.command变量成员看命令和参数自行判断。不然会有比较复杂的代码出现。
![在这里插入图片描述](/images/fa664afc71fe1aea2c85f82c52a772aa.png)
这里是调用Nugetclient来下载包

![在这里插入图片描述](/images/c8dd6f0693826980fec76f7cdb35cf1a.png)
继续步进，看到了Nugetclient里面下载包的函数
![在这里插入图片描述](/images/832157bdd0a76a8b921e40dfc170e17a.png)
继续步进，发现执行到这一句话之后步进程序就不往下走了，直接返回了，终端也报错了。
![在这里插入图片描述](/images/77779b28853d3b3acf74e8d7ac545b7c.png)

看起来和OSInformation.isFipsEnabled的get函数有关，去那个函数里面下了好多断点，因为这个函数压根没法步进，一步进就返回。发现读取了注册表

![在这里插入图片描述](/images/9ddb38e30523f45d01c9b7e5681e7c88.png)
继续走，发现到这步以后就返回了，程序不继续往下走了
![在这里插入图片描述](/images/1b0877445df6cfbeb4a139ace12c8a4d.png)
根据错误提示，指定的转换无效的问题，那么肯定是这个函数里面出现看一些问题。通过查询[手册](https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regqueryvalueexa)发现array2数组类型有可能和返回值不匹配，所以报了这个错误。


于是去没有问题的电脑上看了下值：
![在这里插入图片描述](/images/a52e27ee290431bb752a7c5829363f62.png)
而有问题的电脑上：
![在这里插入图片描述](/images/ca46cb9843ed8062e68b69a6546c9540.png)
很明显不一样，一个是字符串一个是数值，显然数值正确，于是把有问题的值删掉改成REG_DWORD，再运行，果然没问题了。
