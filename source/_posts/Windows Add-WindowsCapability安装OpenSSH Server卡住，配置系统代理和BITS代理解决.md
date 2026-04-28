---
title: windows下安装openssh server卡顿的时候使用代理安装的方法
abbrlink: 2026042801
date: 2026-04-28 23:55:00
tags:
  - Windows
  - OpenSSH
  - 代理
  - PowerShell
---

## 问题现象

一开始我是从 Windows 的“设置 -> 系统 -> 可选功能 -> 查看功能”里添加 `OpenSSH 服务器`，界面一直停在“正在添加”，进度很慢：

![可选功能里安装 OpenSSH 服务器卡住](/images/windows-openssh-server-optional-feature-stuck.png)

后面不再等可选功能页面，改成用命令行安装和排查 OpenSSH Server：

```powershell
Add-WindowsCapability -Online -Name OpenSSH.Server~~~~0.0.1.0
```

命令执行很慢，长时间没有进度。即使给当前 PowerShell 加了代理，例如：

```powershell
$env:http_proxy="http://127.0.0.1:10809"
$env:https_proxy="http://127.0.0.1:10809"
```

也不一定有用。

原因是 `Add-WindowsCapability` 背后不是简单的 PowerShell 下载，而是通过 Windows Update、BITS、CBS/TrustedInstaller 这些系统组件去获取 FoD（Features on Demand）内容。当前用户的环境变量代理不等于系统服务账户代理。

## 排查过程

先看 WinHTTP 代理：

```powershell
netsh winhttp show proxy
```

再看代理端口是否真的在监听：

```powershell
Get-NetTCPConnection -LocalAddress 127.0.0.1 -LocalPort 10809 -State Listen
```

如果使用 v2rayN/xray，通常 HTTP 代理端口是 `127.0.0.1:10809`；如果使用 Clash，常见端口是 `127.0.0.1:7890`。

然后看 CBS/DISM 日志：

```powershell
Select-String -Path C:\Windows\Logs\CBS\CBS.log -Pattern "FCAcquirerWUClient|DownloadProgress|0x"
Select-String -Path C:\Windows\Logs\DISM\dism.log -Pattern "OpenSSH|Add-Capability|0x"
```

我这里看到的关键日志是：

```text
FCAcquirerWUClient: WULib DownloadProgress: [0 / 100]
```

也就是卡在 Windows Update 下载阶段，并不是 OpenSSH 本身安装慢。

还要检查 CBS 是否有待重启事务：

```powershell
Test-Path "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Component Based Servicing\RebootPending"
Test-Path "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\WindowsUpdate\Auto Update\RebootRequired"
```

如果返回 `True`，建议先重启。CBS 有 pending reboot 时，`Add-WindowsCapability` 很容易卡住、失败或重复下载。

## 正确的代理配置

以 `127.0.0.1:10809` 为例，管理员 PowerShell 执行：

```powershell
netsh winhttp set proxy proxy-server="http=127.0.0.1:10809;https=127.0.0.1:10809" bypass-list="localhost;127.0.0.1;<local>"
```

再给 BITS 的三个服务账户设置代理：

```powershell
bitsadmin /util /setieproxy localsystem MANUAL_PROXY 127.0.0.1:10809 NULL
bitsadmin /util /setieproxy networkservice MANUAL_PROXY 127.0.0.1:10809 NULL
bitsadmin /util /setieproxy localservice MANUAL_PROXY 127.0.0.1:10809 NULL
```

重启相关服务：

```powershell
Restart-Service wuauserv,bits,DoSvc,cryptsvc -Force
```

如果之前已经卡了很久，建议直接重启系统。我的情况就是代理配置正确后仍然卡在 0%，重启清掉 CBS pending 状态后才成功。

## 重新安装 OpenSSH Server

重启后确认代理程序已经启动，端口能连通：

```powershell
Test-NetConnection 127.0.0.1 -Port 10809
```

然后执行：

```powershell
dism.exe /Online /Add-Capability /CapabilityName:OpenSSH.Server~~~~0.0.1.0
```

也可以继续使用 PowerShell：

```powershell
Add-WindowsCapability -Online -Name OpenSSH.Server~~~~0.0.1.0
```

注意 capability 名称最后是 `0.0.1.0`，不要写成 `0.0.1.`。

## 安装后启用 sshd

安装成功后检查文件和服务：

```powershell
Test-Path C:\Windows\System32\OpenSSH\sshd.exe
Get-Service sshd
```

启用并启动服务：

```powershell
Set-Service -Name sshd -StartupType Automatic
Start-Service -Name sshd
```

开放防火墙 22 端口：

```powershell
New-NetFirewallRule `
  -Name "OpenSSH-Server-In-TCP" `
  -DisplayName "OpenSSH SSH Server (sshd)" `
  -Enabled True `
  -Direction Inbound `
  -Protocol TCP `
  -Action Allow `
  -LocalPort 22
```

如果规则已经存在，可以改成所有网络配置文件都生效：

```powershell
Set-NetFirewallRule -Name "OpenSSH-Server-In-TCP" -Enabled True -Profile Any
```

## 验证

查看服务：

```powershell
Get-Service sshd
```

正常应该是：

```text
Status   : Running
StartType: Automatic
```

查看监听：

```powershell
netstat -ano -p tcp | Select-String ":22 "
```

正常会看到：

```text
TCP    0.0.0.0:22    0.0.0.0:0    LISTENING
```

局域网其他机器连接：

```bash
ssh 用户名@Windows主机IP
```

例如：

```bash
ssh fjh1996@192.168.1.10
```

## 总结

这个问题的关键点是：

1. `http_proxy` / `https_proxy` 只影响当前进程，不足以让 Windows Update 服务走代理。
2. `Add-WindowsCapability` 背后依赖 Windows Update、BITS 和 CBS。
3. 需要同时配置 WinHTTP 代理和 BITS 服务账户代理。
4. 如果 CBS 已经有 `RebootPending`，先重启，否则可能一直卡在 `DownloadProgress: [0 / 100]`。
5. 安装成功后还要启动 `sshd` 服务并检查防火墙规则。

最终有效流程就是：

```powershell
netsh winhttp set proxy proxy-server="http=127.0.0.1:10809;https=127.0.0.1:10809" bypass-list="localhost;127.0.0.1;<local>"

bitsadmin /util /setieproxy localsystem MANUAL_PROXY 127.0.0.1:10809 NULL
bitsadmin /util /setieproxy networkservice MANUAL_PROXY 127.0.0.1:10809 NULL
bitsadmin /util /setieproxy localservice MANUAL_PROXY 127.0.0.1:10809 NULL

Restart-Service wuauserv,bits,DoSvc,cryptsvc -Force

dism.exe /Online /Add-Capability /CapabilityName:OpenSSH.Server~~~~0.0.1.0

Set-Service -Name sshd -StartupType Automatic
Start-Service -Name sshd
```
