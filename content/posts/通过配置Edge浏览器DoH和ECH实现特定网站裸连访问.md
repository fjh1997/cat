---
title: 通过配置 Edge 浏览器 DoH 和 ECH 实现特定网站如linuxdo裸连访问
abbrlink: 20260316
url: /posts/20260316.html
date: 2026-03-16 12:00:00
tags:
  - 网络
  - Edge
  - DoH
  - ECH
  - DNS
  - 隐私
---

## 前言

有些网站虽然没有被 DNS 污染，但由于 SNI（Server Name Indication）明文暴露了域名，导致连接在 TLS 握手阶段被中间设备识别并重置。典型表现是 DNS 能正常解析出 IP，`ping` 也通，但浏览器就是打不开页面。

解决思路很简单：**DoH（DNS over HTTPS）** 加密 DNS 查询过程，防止 DNS 劫持和污染；**ECH（Encrypted Client Hello）** 加密 TLS 握手中的 SNI 字段，让中间设备无法识别你访问的具体域名。两者配合就可以实现某些被 SNI 阻断的网站的裸连访问。

本文以 Windows + Edge 浏览器为例，记录完整的配置过程。

## 原理简述

### DoH（DNS over HTTPS）

传统 DNS 查询是明文 UDP 协议，任何中间人都能看到和篡改。DoH 将 DNS 查询封装在 HTTPS 请求中，让 DNS 解析过程完全加密。

### ECH（Encrypted Client Hello）

TLS 1.3 握手时，客户端会在 Client Hello 中以**明文**发送 SNI（要访问的域名）。ECH 利用事先通过 DNS HTTPS 记录获取的公钥，对整个 Client Hello 进行加密，让中间设备无法窥探目标域名。

### 两者的关系

ECH 的密钥是通过 DNS 的 `HTTPS` 类型记录（TYPE65）分发的。如果 DNS 查询本身不加密（被劫持或污染），ECH 密钥就拿不到，ECH 自然也无法工作。所以 **DoH 是 ECH 的前置条件**。

```
┌─────────────────────┐
│   DoH DNS 服务器     │
│  (加密 DNS 查询)     │
└────────┬────────────┘
     │
① 通过 HTTPS 加密查询 DNS
② 获取目标站点的 ECH 公钥
     │
┌────▼──────┐                ┌────────────┐              ┌──────────────┐
│  浏览器   │───③ 加密的───→│  中间设备    │────────────→│  目标服务器   │
│          │   Client Hello│ (看不到 SNI) │              │              │
└──────────┘                └─────────────┘              └──────────────┘
```

## 配置步骤

### 第一步：配置 Edge 的 DoH 策略

Edge 浏览器的 DoH 可以通过 Windows 注册表（组策略）来配置。以**管理员权限**打开 PowerShell，执行以下命令：

```powershell
# 启用 Edge 内置 DNS 客户端
reg add "HKLM\SOFTWARE\Policies\Microsoft\Edge" /v BuiltInDnsClientEnabled /t REG_DWORD /d 1 /f

# 设置 DoH 模式为 automatic（优先 DoH，失败回退普通 DNS）
reg add "HKLM\SOFTWARE\Policies\Microsoft\Edge" /v DnsOverHttpsMode /t REG_SZ /d "automatic" /f

# 设置 DoH 服务器模板（替换为你可用的 DoH 服务器地址）
reg add "HKLM\SOFTWARE\Policies\Microsoft\Edge" /v DnsOverHttpsTemplates /t REG_SZ /d "https://your-doh-server.example.com/dns-query" /f
```

**DnsOverHttpsMode 的三种模式：**

| 模式 | 说明 |
|------|------|
| `off` | 完全关闭 DoH |
| `automatic` | 优先 DoH，失败自动回退普通 DNS（**推荐**） |
| `secure` | 强制 DoH，失败则无法解析（⚠️ 如果 DoH 服务器不可用会导致所有网站打不开） |

> **⚠️ 注意**：`secure` 模式虽然安全性最高，但如果你的 DoH 服务器在当前网络不可达（比如国内直连 Cloudflare 的 `1.1.1.1`），会导致**所有网站都无法访问**。建议使用 `automatic` 模式。

**关于 DoH 服务器的选择：**

- Cloudflare 的 `https://cloudflare-dns.com/dns-query`（`1.1.1.1`）是最常见的支持 ECH 密钥分发的 DoH 服务器，但在国内网络可能不可直连。
- **推荐：使用 Cloudflare Gateway (Zero Trust) 创建私人 DoH 节点**。只需要注册一个免费的 Cloudflare 账号，开通 Zero Trust，在 `Gateway -> DNS Locations` 中添加一个 Location，它就会自动为你生成一个私有专属的 DoH 地址（例如 `https://<一串随机字符>.cloudflare-gateway.com/dns-query`）。这种方式目前在国内直连的成功率非常高，而且完全支持 ECH。
- 阿里 DNS 的 `https://dns.alidns.com/dns-query` 在国内虽然可用，但它不一定支持返回 HTTPS 类型 DNS 记录（ECH 所需），所以不推荐用作 ECH 方案。
- 如果你有自建的 DoH 代理或中转服务器，使用你自己的 DoH 地址效果最好，如 linux.do 站长秦始皇提供的 DoH 地址是：`https://xxx.ddd.oaifree.com/query-dns`（其中 xxx 可以随便换成你喜欢的字符）。

**验证配置：**

```powershell
reg query "HKLM\SOFTWARE\Policies\Microsoft\Edge" /v DnsOverHttpsMode
reg query "HKLM\SOFTWARE\Policies\Microsoft\Edge" /v DnsOverHttpsTemplates
reg query "HKLM\SOFTWARE\Policies\Microsoft\Edge" /v BuiltInDnsClientEnabled
```

### 第二步：启用 Edge 的 ECH 功能

ECH 同样可以通过注册表策略来启用。以**管理员权限**执行：

```powershell
# 启用 Encrypted Client Hello
reg add "HKLM\SOFTWARE\Policies\Microsoft\Edge" /v EncryptedClientHelloEnabled /t REG_DWORD /d 1 /f
```

验证：

```powershell
reg query "HKLM\SOFTWARE\Policies\Microsoft\Edge" /v EncryptedClientHelloEnabled
```

> **💡 说明**：较早版本的 Edge 可以在 `edge://flags/#encrypted-client-hello` 中手动启用 ECH，但新版 Edge（146+）已移除该 flag，需要通过注册表策略 `EncryptedClientHelloEnabled` 来控制。

### 第三步：（可选）配置系统级 DNS 加密

除了 Edge 内部的 DoH 之外，还可以在 Windows 系统层面配置 DNS 加密，让系统的 DNS 查询也走加密通道：

```powershell
# 以管理员权限运行

# 1. 将以太网适配器的 DNS 设置为 1.1.1.1 和 1.0.0.1
#    先用 Get-NetAdapter 查看你的网络适配器名称和 InterfaceIndex
Get-NetAdapter | Where-Object Status -eq 'Up' | Select-Object Name, InterfaceIndex

# 2. 设置 DNS 服务器（将 13 替换为你的适配器 InterfaceIndex）
Set-DnsClientServerAddress -InterfaceIndex 13 -ServerAddresses "1.1.1.1","1.0.0.1"

# 3. 启用 DoH 自动升级
Set-DnsClientDohServerAddress -ServerAddress "1.1.1.1" `
    -DohTemplate "https://cloudflare-dns.com/dns-query" `
    -AllowFallbackToUdp $true -AutoUpgrade $true

Set-DnsClientDohServerAddress -ServerAddress "1.0.0.1" `
    -DohTemplate "https://cloudflare-dns.com/dns-query" `
    -AllowFallbackToUdp $true -AutoUpgrade $true
```

参数说明：
- **AutoUpgrade = $true**：Windows 会自动将发往该 IP 的 DNS 查询升级为 DoH 加密请求
- **AllowFallbackToUdp = $true**：DoH 连接失败时回退到普通 UDP DNS，避免断网

## 验证配置

### 在线测试

访问 Cloudflare 的浏览器安全检测页面：[https://www.cloudflare-cn.com/ssl/encrypted-sni/](https://www.cloudflare-cn.com/ssl/encrypted-sni/)

点击 **"检查我的浏览器"** 按钮，期望结果：

| 项目 | 期望状态 |
|------|---------|
| 安全的 DNS (DoH) | ✅ 通过 |
| DNSSEC | ✅ 通过 |
| TLS 1.3 | ✅ 通过 |
| 安全 SNI (ECH) | ✅ 通过 |

也可以用这个网站测试ech和doh情况：https://doh-ech.zhoulirui.ggff.net/

### 命令行测试

```powershell
# 验证 Edge DoH 和 ECH 策略
reg query "HKLM\SOFTWARE\Policies\Microsoft\Edge"

# 验证系统 DNS 配置
Get-DnsClientServerAddress -InterfaceIndex 13
Get-DnsClientDohServerAddress -ServerAddress "1.1.1.1"
```

## 排错指南

### 所有网站都打不开

- 可能是 `DnsOverHttpsMode` 设置为 `secure` 但 DoH 服务器不可达
- 解决：改回 `automatic` 模式
  ```powershell
  reg add "HKLM\SOFTWARE\Policies\Microsoft\Edge" /v DnsOverHttpsMode /t REG_SZ /d "automatic" /f
  ```

### DoH 测试未通过

- DoH 服务器在当前网络不可达（如国内直连 Cloudflare）
- 解决：使用国内可达的 DoH 服务器，或者配置代理

### ECH 测试未通过

ECH 不通过最常见的原因：

1. **DoH 服务器不支持返回 HTTPS 类型 DNS 记录**：ECH 密钥通过 DNS HTTPS 记录（TYPE65）分发，不是所有 DoH 服务器都会返回这种记录
2. **目标网站不支持 ECH**：ECH 需要服务端也支持。目前主要是 Cloudflare 托管的网站支持 ECH
3. **ECH 策略未启用**：确认注册表中 `EncryptedClientHelloEnabled` 值为 `1`
   ```powershell
   reg query "HKLM\SOFTWARE\Policies\Microsoft\Edge" /v EncryptedClientHelloEnabled
   ```

## 总结

通过配置 DoH + ECH，可以实现对部分被 SNI 阻断的网站的裸连访问（无需代理）。核心配置只有三步：

1. **Edge DoH 策略**：通过注册表设置 DoH 模式和 DoH 服务器地址
2. **Edge ECH 策略**：通过注册表设置 `EncryptedClientHelloEnabled` 启用 ECH
3. **（可选）系统 DNS**：在 Windows 系统层面启用 DNS 加密

需要注意的是，这种方案的效果取决于你的网络环境和 DoH 服务器的可达性。最关键的一环是**找到一个在你的网络下可正常使用且支持 HTTPS DNS 记录的 DoH 服务器**。
