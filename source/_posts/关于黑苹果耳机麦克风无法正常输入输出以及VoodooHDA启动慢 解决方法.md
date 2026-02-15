---
title: 关于黑苹果耳机麦克风无法正常输入输出以及VoodooHDA启动慢 解决方法
abbrlink: 42338
date: 2019-01-03 23:32:57
tags:
---

很简单，参考了 这个人的做法


[https://github.com/athlonreg/AppleALC-ALCPlugFix](https://github.com/athlonreg/AppleALC-ALCPlugFix)

去/System/Library/Extensions 里面把AppleHDA删除即可，同时在EFI的clover/kexts/里安装VoodooHDA即可，主要原因是苹果本身的声卡驱动AppleHDA和VoodooHDA万能声卡驱动的冲突问题。

If your headphone and microphone don't work normally in hackintosh, just install the universe audio driver named VoodooHDA.

and to solve the problem about the hackintosh longtime boot loading after installed VoodooHDA, Just to remove the AppleHDA.kexts in/System/Library/Extensions . because of the reason that these two have conflicts.

另外，由于我的主板有一个特点，就是电脑长期不用会进入休眠状态，必须重新按电源以唤醒，然而我的黑苹果在被唤醒以后，声音无法正常输出，因此考虑到是声音驱动的问题，尝试重新卸载驱动

```bash

sudo kextunload /System/Library/Extensions/VoodooHDA.kext
```

如果报错，多卸载几次就会成功，然而卸载之后装回去就需要用到命令

```bash

sudo kextload /System/Library/Extensions/VoodooHDA.kext
```

这步报错了，提示

```bash

/System/Library/Extensions/VoodooHDA.kext failed to load - (libkern/kext) authentication failure 
(file ownership/permissions); check the system/kernel logs for errors or try kextutil(8).
```

意思是权限问题，于是我又加了权限

```bash

sudo chmod -R 777 /System/Library/Extensions/VoodooHDA.kext
```

但是依旧报错，依据报错内容，我试图查看system/kernel的log，但是找了一圈找不到内核日志在哪，于是就依据kextutil(8)的提示使用了如下命令

```bash

sudo kextutil /System/Library/Extensions/VoodooHDA.kext
```

提示如下信息

```bash

Kext with invalid signatured (-67062) allowed: <OSKext 0x7fb4c1e0c980 [0x7fff8b341b30]> { URL =
 "file:///Library/Extensions/VoodooHDA.kext/", ID = "org.voodoo.driver.VoodooHDA" }
Kext rejected due to improper filesystem permissions: <OSKext 0x7fb4c1e07ff0 [0x7fff8b341b30]> { URL = 
"file:///System/Library/Extensions/VoodooHDA.kext/", ID = "org.voodoo.driver.VoodooHDA" }
Code Signing Failure: not code signed
Authentication Failures: 
    File owner/permissions are incorrect (must be root:wheel, nonwritable by group/other): 
        /System/Library/Extensions/VoodooHDA.kext
        Contents
        Info.plist
        MacOS
        VoodooHDA

Diagnostics for /System/Library/Extensions/VoodooHDA.kext:
Authentication Failures: 
    File owner/permissions are incorrect (must be root:wheel, nonwritable by group/other): 
        /System/Library/Extensions/VoodooHDA.kext
        Contents
        Info.plist
        MacOS
        VoodooHDA
```

可见，权限设置必须为“must be root:wheel, nonwritable by group/other”，真是大开眼界，看来权限不是越大越好，这里会检测用户组的权限，如果有写权限就会报错。于是，我修改权限之后成功load恢复声音驱动。

```bash

sudo chmod -R 755 /System/Library/Extensions/VoodooHDA.kext

sudo chown -R root /System/Library/Extensions/VoodooHDA.kext

sudo chgrp -R wheel /System/Library/Extensions/VoodooHDA.kext

sudo kextload /System/Library/Extensions/VoodooHDA.kext
```

终于又有声音了！

首先去这里下载voodoohda的最新版本：


[https://github.com/chris1111/VoodooHDA-2.9.2-Clover-V14/releases](https://github.com/chris1111/VoodooHDA-2.9.2-Clover-V14/releases)

![](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/f9b841c1c95bc42882ce5d0c51673833.png)

下载完之后会提示你安装，在这里选择自定

![](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/8b6949bcf54aa2c7b3e6aeb6690ab760.png)

选择你需要的版本，比如我是mojave

![](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/ba67d2aaf71add991c611c8569ceb67c.png)

之后安装完之后去系统偏好设置->用户与群组->登录项

里面把voodoohda选上

![](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/5f429e9630816a17ceaa6464558a215f.png)

![](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/27e852121ef88a5c9beb209c1b6c8670.png)

之后就能够在偏好里保存设置了。

![](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/e4848379e711a9b81420c16ddccdc5da.png)

![](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/9558e8760e3dd55a2478ec215508f553.png)
