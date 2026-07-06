---
title: 'VMware Workstation 虚拟网卡丢失 + VMware Tools 复制粘贴失效的完整排查与修复'
date: 2026-04-16 14:38:00
url: /posts/10604.html
tags:
  - VMware
  - Windows
  - 虚拟化
  - 网络
categories:
  - 运维排错
---

## 问题背景

宿主机 Windows（VMware Workstation 17.6.0），虚拟机 Windows 7 SP1 32位。遇到两个问题：
1. 宿主机无法连接虚拟机（ping 不通）
2. 修复网络后，VMware Tools 的复制粘贴功能不工作

以下是完整的排查过程。

## 问题一：宿主机无法连接虚拟机

### 现象

虚拟机 IP 为 `192.168.191.129`（NAT 模式），从宿主机 ping 100% 丢包：

```
ping 192.168.191.129
请求超时。
请求超时。
数据包: 已发送 = 2，已接收 = 0，丢失 = 2 (100% 丢失)
```

### 排查过程

检查宿主机网卡状态：

```powershell
Get-NetAdapter | Format-Table Name, InterfaceDescription, Status, MacAddress -AutoSize
```

```
Name                          InterfaceDescription                       Status      MacAddress
----                          --------------------                       ------      ----------
以太网                        Intel(R) Ethernet Connection (22) I219-LM  Up          F4-F1-9E-42-D8-DD
VMware Network Adapter VMnet1 VMware Virtual Ethernet Adapter for VMnet1 Not Present 00-50-56-C0-00-01
VMware Network Adapter VMnet8 VMware Virtual Ethernet Adapter for VMnet8 Not Present 00-50-56-C0-00-08
```

关键发现：VMnet1（Host-Only）和 VMnet8（NAT）状态都是 `Not Present`，`AdminStatus: Down`。

再看 IPv4 地址分配：

```powershell
Get-NetIPAddress -AddressFamily IPv4 | Format-Table InterfaceAlias, IPAddress, PrefixLength -AutoSize
```

```
InterfaceAlias              IPAddress   PrefixLength
--------------              ---------   ------------
以太网                      10.30.17.50           24
Loopback Pseudo-Interface 1 127.0.0.1              8
```

宿主机只有物理网卡有 IP，VMware 虚拟网卡完全没有加载，自然没有到 `192.168.191.x` 网段的路由。

同时 VMware NAT Service 虽然在运行，但网卡驱动本身没有加载：

```powershell
Get-Service -Name 'VMware*' | Format-Table Name, DisplayName, Status -AutoSize
```

```
Name                   DisplayName          Status
----                   -----------          ------
VMware NAT Service     VMware NAT Service  Running
VmwareAutostartService VMware 自动启动服务  Stopped
```

### 根因

VMware 虚拟网卡驱动未正确加载，网卡处于 `Not Present` 状态。NAT Service 虽然在跑，但没有对应的虚拟网卡承载流量。

### 解决方法

打开 VMware Workstation → Edit → Virtual Network Editor → 点击 "Restore Defaults"（需要管理员权限）。这会重新创建 VMnet1/VMnet8 并重装虚拟网卡驱动。

如果不行，还可以：
- 在设备管理器中检查是否有被禁用或带感叹号的 VMware 网卡，右键启用或更新驱动
- 修复安装 VMware Workstation（运行安装程序选 Repair）

恢复后虚拟机 IP 变为 `192.168.78.128`，网络连通。

## 问题二：VMware Tools 服务启动失败

### 现象

网络恢复后，SSH 进入虚拟机发现 VMware Tools 没有正常工作。

### 排查过程

通过 SSH（paramiko）远程执行命令检查（注意：这台 VM 是 Windows 7，不是 Linux）：

```cmd
sc query VMTools
```

```
SERVICE_NAME: VMTools
        TYPE               : 10  WIN32_OWN_PROCESS
        STATE              : 1  STOPPED
        WIN32_EXIT_CODE    : 183 (0xB7)
```

VMTools 服务状态为 `STOPPED`，退出码 `183`（`ERROR_ALREADY_EXISTS`）。

同时检查进程：

```cmd
tasklist | findstr /i vmtoolsd
```

发现 `vmtoolsd.exe`（PID 1868）在用户会话（Console Session 1）里运行着——这是用户态的托盘进程，但系统服务层面的 VMTools 没有启动。

### 根因

之前异常退出后残留了用户态 `vmtoolsd.exe` 进程，占用了资源，导致系统服务启动时报错 183（`ERROR_ALREADY_EXISTS`，资源冲突）。

### 解决方法

```cmd
:: 先杀掉残留的 vmtoolsd 进程
taskkill /f /im vmtoolsd.exe

:: 然后重新启动服务
net start VMTools
```

执行后服务恢复正常：

```
SERVICE_NAME: VMTools
        STATE              : 4  RUNNING
        WIN32_EXIT_CODE    : 0
```

## 问题三：复制粘贴仍然不工作

### 现象

VMTools 服务正常运行后，宿主机和虚拟机之间的复制粘贴仍然不可用。

### 排查过程

#### 第一步：检查用户态进程

复制粘贴功能依赖两个 `vmtoolsd.exe` 进程：
- 系统服务进程（Session 0）：负责基础的 Guest-Host 通信
- 用户态进程 `vmtoolsd.exe -n vmusr`（桌面会话）：负责加载 `dndcp.dll` 插件处理剪贴板同步和拖拽

检查发现只有系统服务进程在运行，用户态进程缺失。

确认插件文件存在：

```cmd
dir "C:\Program Files\VMware\VMware Tools\plugins\vmusr"
```

`dndcp.dll`（拖拽和复制粘贴插件）文件完好。

注册表中 VMware User Process 启动项也存在，但重启后用户态进程就是没有自动拉起。

#### 第二步：尝试手动启动用户态进程

由于 SSH 会话处于 Session 0（服务会话），直接 `start` 无法在 Session 1 的桌面上创建进程。通过创建批处理文件 + 计划任务的方式在用户桌面会话中启动：

```cmd
echo start "" "C:/PROGRA~1/VMware/VMware Tools/vmtoolsd.exe" -n vmusr > C:/vmusr.bat
schtasks /create /tn "StartVMusr" /tr "C:/vmusr.bat" /sc once /st 00:00 /f /rl highest
schtasks /run /tn "StartVMusr"
```

启动后确认两个进程都在运行：
- PID 1384 — Services 会话（系统服务）
- PID 2772 — Console Session 1，ADMIN 用户（用户态）

但复制粘贴仍然不工作，而且重启虚拟机后用户态进程又消失了。说明手动拉起只是临时方案，根本原因在别处。

#### 第三步：检查 VMX 配置

检查虚拟机的 `.vmx` 配置文件（`D:\Windows 7\Windows 7.vmx`），发现只有：

```
isolation.tools.hgfs.disable = "FALSE"
```

缺少 copy/paste 相关的配置项。在 VMware Workstation 17 上，如果没有显式启用，默认可能是禁用的。

通过 rpctool 在 Guest 内确认 isolation 状态均为 `UNSET`，说明 VMX 层面没有显式配置。

### 根因

两个原因叠加：
1. VMX 配置文件中缺少 `isolation.tools.copy.disable = "FALSE"` 和 `isolation.tools.paste.disable = "FALSE"` 的显式配置，在 Workstation 17 上默认行为可能是禁用
2. 由于 isolation 配置缺失，用户态 `vmtoolsd -n vmusr` 进程无法正常自动启动（负责剪贴板同步的进程缺失）

也就是说，用户态进程不自动启动的根本原因就是 VMX 里缺少 isolation 配置。加上配置后，重启虚拟机用户态进程就能正常自动拉起了。

### 解决方法

关闭虚拟机，在 `.vmx` 文件中添加以下三行：

```
isolation.tools.copy.disable = "FALSE"
isolation.tools.paste.disable = "FALSE"
isolation.tools.dnd.disable = "FALSE"
```

然后重新启动虚拟机。启动后验证：
- VMTools 服务正常运行（RUNNING）
- 用户态 `vmtoolsd -n vmusr`（Console Session 1）自动启动——之前一直无法自启的问题也一并解决
- 复制粘贴功能恢复正常

## 总结

| 问题 | 根因 | 解决方法 |
|------|------|----------|
| 宿主机 ping 不通虚拟机 | VMware 虚拟网卡驱动未加载（Not Present） | Virtual Network Editor → Restore Defaults |
| VMTools 服务启动失败（错误码 183） | 残留的用户态 vmtoolsd 进程占用资源 | `taskkill /f /im vmtoolsd.exe` 后重启服务 |
| 复制粘贴不工作 + 用户态 vmtoolsd 不自启 | VMX 缺少 isolation 配置，导致用户态进程无法自启 | 在 vmx 中添加 copy/paste/dnd 的 disable=FALSE 配置后重启 |
