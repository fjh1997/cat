---
title: 使用msvc命令行或msbuild编译dx3程序
abbrlink: 4601
url: /posts/4601.html
date: 2023-02-28 23:07:28
tags:
---

从这里下载：https://github.com/microsoft/DirectX-Graphics-Samples
```bash
cl.exe /D "UNICODE"  /D "_UNICODE" *.cpp /EHsc -I C:\Users\54930\Downloads\DirectX-Graphics-Samples-master\Samples\Desktop\D3D12nBodyGravity\src\WinPixEventRuntime.1.0.161208001\Include\WinPixEventRuntime  dxgi.lib d3d12.lib d3dcompiler.lib dxguid.lib  user32.lib shell32.lib

```
错误：
>  error C2664: “DWORD GetModuleFileNameA(HMODULE,LPSTR,DWORD) ”: 无法将参数 2 从“WCHAR *”转换为“LPSTR”

参数:
```bash
/D "UNICODE"  /D "_UNICODE"
```
错误：

>  无法解析的外部符号 XXXX

需要加上lib ,lib 在.vcxproj和package.config里面看，如

```bash
 <AdditionalDependencies>dxgi.lib;d3d12.lib;d3dcompiler.lib;dxguid.lib;%(AdditionalDependencies)</AdditionalDependencies>
```
如

```bash
  <package id="WinPixEventRuntime" version="1.0.161208001" targetFramework="native" />
```
则需要命令```nuget install```来安装相关依赖包
需要注意的是里面%(AdditionalDependencies)是VS自带的环境变量，需要去网上找一下。我们这个项目里不带 user32.lib shell32.lib就会报错。

错误：

> fatal error C1083: 无法打开包括文件: “pix3.h”: No such file or directory

同上，cl.exe编译时后加-I参数指定依赖包提供的头文件路径。

参考：
https://learn.microsoft.com/zh-cn/cpp/build/reference/cl-invokes-the-linker?view=msvc-170

实际上更简单的方法是直接在当前src目录下运行MSbuild.exe但需要修改.vcxproj一些地方

```bash
 <WindowsTargetPlatformVersion>10.0.22621.0</WindowsTargetPlatformVersion>
```
修改为你的windows sdk版本

```bash
 <PlatformToolset>v143</PlatformToolset>
```
修改为你的msvc版本
然后就是在当前目录下新建packages，把nuget装的包放到当前目录下的packages里面，之后msbuild输出命令能看到完整的编译链接命令。

![在这里插入图片描述](/images/31bc7ba5c4c914bcb26daafe07289da2.png)

