---
title: 彻底解决移动光猫（ZN-M180G）IPv6 频繁掉线：禁用高负载 Java/OSGi 插件实录
date: 2026-03-19 19:30:00
url: /posts/17175.html
tags:
  - 路由器
  - IPv6
  - 移动光猫
  - OSGi
  - 性能优化
categories:
  - 网络技术
---

# 彻底解决移动光猫（ZN-M180G）IPv6 频繁掉线

## 0. 参考文献与前置准备

在进行任何底层操作前，请务必参考以下社区讨论，确保您拥有光猫的超级管理权限。

*   **参考文献**：[恩山无线论坛 - 移动光猫 ZN-M180G/ZTE 系维护指南](https://www.right.com.cn/forum/thread-7362164-1-1.html)
*   **开启 Telnet 方法**：
    在浏览器地址栏直接输入以下地址并回车，显示 `TelnetSet Success` 即表示开启成功：
    `http://192.168.1.1/usr=CMCCAdmin&psw=aDm8H%25MdA&cmd=1&telnet.gch`
    *(注：默认超级账号为 `CMCCAdmin`，密码通常为 `aDm8H%MdA`)*

---

## 1. 问题现象
家中的移动光猫（ZN-M180G）IPv6 连接极度不稳定。表现为：电脑刚开机时有 IPv6 且通畅，但过一段时间（几十分钟到几小时）后，IPv6 地址会突然消失，或者虽然有地址但无法 Ping 通。必须手动去路由器后台重开关 RA/DHCPv6 才能暂时恢复。

与此形成鲜明对比的是，IPv4 却始终稳如泰山。

## 2. 深度排查：为什么 IPv6 会掉？

### 2.1 性能分析：Load Average 13 的惊悚现场
通过 Telnet 登录光猫后台，执行 `uptime` 和 `top` 命令，发现了令人震惊的一幕：
```bash
~ $ uptime
Load average: 13.35 12.43 11.99
```
**诊断**：对于这类嵌入式网关，Load Average 超过 1 即为满载。13 意味着系统的处理压力是其极限能力的 **10 倍以上**！

### 2.2 罪魁祸首：OSGi 与 Java 插件
在进程列表（`ps`）中，我们发现了一个占用超过 **239MB 内存** 的 Java 进程：
```bash
1420  1  java  S  239m 50.1  0  0.0 java -noverify -Dfile.encoding=UTF-8 ...
```
这就是移动光猫预装的 **OSGi (Open Service Gateway Initiative)** 智能插件环境（如 AndLink/和家亲插件）。它极其吃资源，抢占了内核处理 IPv6 报文的信号量。

### 2.3 根源分析：IPv6 的“心跳机制”
IPv6 依赖路由器周期性发送 **RA (Router Advertisement)** 通告。当光猫 CPU 被 Java 插件占满时，RA 发送进程会被卡死。电脑听不到“心跳”通告，就会认为 IPv6 已失效，从而删除地址。而 IPv4 是基于租约制的“合同”，对 CPU 实时性要求较低，所以 IPv4 没问题。

---

## 3. 终极解决方案：三维打击

由于网页端（Web）往往隐藏了插件开关，且简单的 `kill` 命令无法阻止插件自动重启，我们采取以下三种深度修复手段：

### 3.1 文件层：重命名 Java 二进制（断其生路）
通过 Telnet 将 Java 的执行文件改名，这样即便启动脚本尝试调用，也会因找不到文件而失败。
```powershell
# Telnet 登录后执行
mv /usr/local/osgi/local/j2re/bin/java /usr/local/osgi/local/j2re/bin/java_bak
```

### 3.2 配置层：sidbg 数据库修改（锁其开关）
利用中兴系底层的 `sidbg` 工具，从数据库层面彻底关闭 OSGi 启动项。
```bash
# 禁用 OSGi 服务
sidbg 1 DB set OBJ_OSGI_ID 0 Enable 0
# 禁用 AndLink 服务
sidbg 1 DB set OBJ_ANDLINK_ID 0 Enable 0
# 保存配置并重启
sidbg 1 DB save
reboot
```

### 3.3 客户端层：Windows 协议栈重置（清理残留）
光猫重启后，由于前缀可能变化，电脑会残留过期的 IPv6 租约。需在电脑端以管理员权限运行：
```powershell
# 重置 IPv6 协议栈并重启网卡
netsh int ipv6 reset
Disable-NetAdapter -Name "以太网"
Enable-NetAdapter -Name "以太网"
# 重新请求地址
ipconfig /renew6
```

---

## 4. 修复结果对比

*   **修复前**：Load Average > 11，Java 进程常驻，IPv6 每小时掉线一次。
*   **修复后**：Load Average < 1.0，CPU 占用率跌至 10% 以下，内存释放 200MB+，IPv6 永久在线且延迟极低。

## 5. 总结
移动定制路由器的 IPv6 不稳定，90% 的原因都是因为预装的 Java 插件抢占了系统资源。通过 **“改名 + 数据库禁用”** 的方案，不仅能解决 IPv6 掉线问题，还能显著提升光猫的转发性能和网页后台响应速度。

---
*本文由 Gemini CLI 协作排查整理而成。*
