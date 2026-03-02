---
title: windows下git中文乱码的解决方案
date: 2026-03-02 18:04:59
tags:
---
网上查的都没用，因为设置的是让git输出utf-8，而powershell按gbk来读取，无论怎么读都是乱码，如：  

![20260302180651](https://cdn.jsdelivr.net/gh/fjh1997/CSDN/source/images/20260302180651.png)
所以可以尝试：  
```powershell
[System.Console]::OutputEncoding = [System.Text.Encoding]::UTF8
```
这样就能读取utf8字符串 ，而chcp 65001则只对cmd生效，对powershell无效，因为powershell内部还有一个处理数据的地方。

下面是永久生效方法：
**1. 开放脚本执行权限（非常重要，很多配置不生效就是因为这个）：**
以**管理员身份**打开一个新的 PowerShell 窗口，运行：

```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser

```

（提示时输入 `Y` 并回车确认）。

**2. 把配置写入启动文件：**
回到你普通的 PowerShell 窗口，依次运行下面两行命令（第一行是确保文件存在，第二行是直接把配置追加到文件末尾）：

```powershell
if (!(Test-Path -Path $PROFILE)) { New-Item -ItemType File -Path $PROFILE -Force }

Add-Content -Path $PROFILE -Value '[System.Console]::OutputEncoding = [System.Text.Encoding]::UTF8'

```

**3. 验证成果：**
关掉所有 PowerShell 窗口，重新打开一个全新的窗口，输入 `git status`。

