---
title: 解决 Google Play 在 v2rayNG 下卡在等待下载的问题
abbrlink: 20260605
date: 2026-06-05 20:30:00
tags:
  - Android
  - Google Play
  - v2rayNG
  - 网络排查
---

## 问题现象

一台 OnePlus / ColorOS 设备上，Google Play 可以打开，也能搜索应用，但是安装应用时一直显示“等待中”或者“正在等待下载”。设备已经 root，可以在 Termux 里使用 `su` 执行系统命令。

当时环境大致如下：

- Android 16
- Google Play 商店版本：`40.1.20-23`
- Google Play 服务版本：`26.19.34`
- v2rayNG：`2.0.18`
- 当前代理节点：`TLS-Vision-Unlimited-IPv4`

## 先排除常见问题

先看空间：

```bash
df -h /data /storage/emulated/0
```

结果 `/data` 可用空间还有几百 GB，所以不是空间不足。

再确认几个核心包是否存在：

```bash
pm path com.android.vending
pm path com.google.android.gms
pm path com.google.android.gsf
pm path com.android.providers.downloads
```

这些包都存在。root 下进一步看包状态：

```bash
su -c '/system/bin/dumpsys package com.android.vending | grep -E "versionName|lastUpdateTime|installerPackageName|User 0"'
su -c '/system/bin/dumpsys package com.google.android.gms | grep -E "versionName|lastUpdateTime|installerPackageName|User 0"'
su -c '/system/bin/dumpsys package com.android.providers.downloads | grep -E "versionName|User 0"'
```

结论：

- Play 商店、Play 服务、GSF、下载管理器都没有被禁用。
- Play 商店版本比较旧，最后更新时间停在 2025-03-12。
- 下载管理器正常启用。

## 清掉旧的卡死下载任务

一开始在下载管理器数据库里发现了一个旧的 Play 下载任务：

```bash
su -c 'content query --uri content://downloads/all_downloads'
```

其中有一条记录类似：

```text
notificationpackage=com.android.vending
allowed_network_types=2
status=194
errorMsg=Binding socket to network 182 failed: EPERM (Operation not permitted)
uri=https://rr5---sn-a5mekn6r.gvt1.com/play-apps-download-default/download/by-id/...
```

这里有两个重点：

- `allowed_network_types=2` 表示任务只允许 Wi-Fi。
- `Binding socket to network 182 failed` 表示它还绑到了一个已经失效的网络。

删除这条旧任务：

```bash
su -c 'content delete --uri content://downloads/all_downloads/103519'
su -c 'am force-stop com.android.vending; am force-stop com.android.providers.downloads; am force-stop com.google.android.gms'
su -c 'cmd package clear --user 0 --cache-only com.android.providers.downloads; cmd package clear --user 0 --cache-only com.android.vending'
```

这一步可以解决旧任务残留导致的“等待中”，但本次问题还没有完全解决。

## 抓 Play 下载服务日志

重新点下载后，继续抓日志：

```bash
su -c 'logcat -d -t 3000 | grep -Ei "Finsky|DownloadService|CronetDownloader|CANNOT_CONNECT|ERR_QUIC|ERR_CONNECTION|WAITING_FOR_RETRY|RUNNING|QUEUED|gvt1|CronetUrlRequest"'
```

关键日志：

```text
CronetDownloader: onFailed
Exception in CronetUrlRequest: net::ERR_CONNECTION_CLOSED
Download Service Error: CANNOT_CONNECT (8)
Updating listeners of <... QUEUED with WAITING_FOR_RETRY ...>
```

中间还出现过：

```text
net::ERR_QUIC_PROTOCOL_ERROR
```

这说明 Play 不是真的单纯排队，而是下载服务连接失败后进入等待重试。

为了排除 QUIC/HTTP3 影响，我临时对 Play 和 GMS 禁了 UDP 443：

```bash
su -c 'iptables -I OUTPUT -p udp --dport 443 -m owner --uid-owner 10248 -j REJECT'
su -c 'iptables -I OUTPUT -p udp --dport 443 -m owner --uid-owner 10242 -j REJECT'
```

其中：

- `10248` 是 Play 商店 UID。
- `10242` 是 Google Play 服务 UID。

禁掉 UDP 443 后，QUIC 错误减少，但仍然出现 TCP 层的 `ERR_CONNECTION_CLOSED`，所以问题不只是 QUIC。

## 找到真正失败的域名

Play 的下载 URL 不一定直接出现在 logcat 里，可以复制它的本地数据库出来读：

```bash
su -c 'cp /data/data/com.android.vending/databases/download_service /tmp/play_download_service.db; chmod 644 /tmp/play_download_service.db'
python3 - <<'PY'
import pathlib, re
data = pathlib.Path('/tmp/play_download_service.db').read_bytes()
urls = sorted(set(m.decode('utf-8', 'ignore') for m in re.findall(rb'https?://[^\x00\s"\']+', data)))
for u in urls:
    print(u[:500])
PY
```

查到当前 Play 下载库里实际使用的是：

```text
https://services.googleapis.cn/download/by-token/download?token=...
```

旧任务里还出现过：

```text
https://rr5---sn-a5mekn6r.gvt1.com/play-apps-download-default/download/by-id/...
```

因此重点域名是：

```text
services.googleapis.cn
redirector.gvt1.com
*.gvt1.com
```

## 本机连通性测试

直接在 Termux 里测试：

```bash
curl -I --connect-timeout 10 https://services.googleapis.cn
curl -I --connect-timeout 10 https://redirector.gvt1.com
curl -I --connect-timeout 10 https://rr5---sn-a5mekn6r.gvt1.com
curl -I --connect-timeout 10 https://play.googleapis.com
```

一开始结果是：

```text
services.googleapis.cn      TLS connect error: unexpected eof while reading
redirector.gvt1.com         TLS connect error: unexpected eof while reading
rr5---sn-a5mekn6r.gvt1.com  HTTP/1.1 404 Not Found
play.googleapis.com         HTTP/2 404
```

404 在这里反而说明 TLS 和 HTTP 都是通的，只是访问根路径不是有效接口。真正有问题的是 `unexpected eof while reading`，也就是 TLS 握手阶段被断开。

为了判断是不是域名本身的问题，又用 check-host 从第三方节点测：

```bash
curl -s 'https://check-host.net/check-http?host=https://services.googleapis.cn&max_nodes=8' -H 'Accept: application/json'
curl -s 'https://check-host.net/check-http?host=https://redirector.gvt1.com&max_nodes=8' -H 'Accept: application/json'
```

外部节点访问 `services.googleapis.cn` 和 `redirector.gvt1.com` 基本都返回 404，说明域名本身没有挂，是本机当前代理线路有问题。

## 检查 v2rayNG 路由配置

v2rayNG 2.0.18 的配置存在 MMKV 里：

```bash
su -c 'strings /data/data/com.v2ray.ang/files/mmkv/SETTING | grep -Ei "routing|geosite|gvt1|googleapis|services.googleapis|direct|proxy" -C2'
```

当时配置里能看到类似规则：

```json
{
  "domain": [
    "services.googleapis.cn",
    "*.gvt1.com",
    "redirector.gvt1.com",
    "*.googleusercontent.com"
  ],
  "enabled": true,
  "outboundTag": "proxy",
  "remarks": "playstore"
}
```

而且它的位置在 `geosite:cn -> direct` 前面。分应用代理里也包含：

```text
com.android.vending
com.google.android.gms
com.android.providers.downloads
com.termux
```

所以表面看路由顺序没问题。

为了进一步排除“VPN 路由没生效”，我直接强制使用 v2rayNG 的本地 socks 端口测试：

```bash
curl --socks5-hostname 127.0.0.1:10808 -I --connect-timeout 10 https://services.googleapis.cn
curl --socks5-hostname 127.0.0.1:10808 -I --connect-timeout 10 https://redirector.gvt1.com
```

如果强制 socks 也失败，说明不是路由规则顺序问题，而是当前节点或服务端出站本身连不上这些域名。

当时测试结果就是强制 socks 也失败：

```text
TLS connect error: unexpected eof while reading
```

因此定位为当前节点对 `services.googleapis.cn` 和 `redirector.gvt1.com` 的 TLS 握手不正常。

## 修复办法

最终调整 v2rayNG 路由，让 Play 下载相关域名明确走代理，并确保规则在 `geosite:cn` 直连规则前面：

```text
full:services.googleapis.cn
full:redirector.gvt1.com
domain:gvt1.com
domain:googleapis.cn
domain:googleusercontent.com
geosite:google
```

出站选择 `proxy`。

如果用的是简单路由界面，逻辑应该是：

```text
代理：
full:services.googleapis.cn
full:redirector.gvt1.com
domain:gvt1.com
domain:googleapis.cn
domain:googleusercontent.com
geosite:google

直连：
geosite:cn
geoip:cn
```

注意：`services.googleapis.cn` 虽然是 `.cn` 域名，但它是 Google Play 下载入口，不能让它被 `geosite:cn` 提前命中走直连。

调整后重新测试：

```bash
curl -I --connect-timeout 10 https://services.googleapis.cn
curl -I --connect-timeout 10 https://redirector.gvt1.com
curl --socks5-hostname 127.0.0.1:10808 -I --connect-timeout 10 https://services.googleapis.cn
curl --socks5-hostname 127.0.0.1:10808 -I --connect-timeout 10 https://redirector.gvt1.com
```

正常结果：

```text
services.googleapis.cn   HTTP/2 404
redirector.gvt1.com      HTTP/2 404
```

出现 404 没关系，说明 TLS/HTTPS 已经通了。

最后强停 Play 商店和下载管理器，再重新下载：

```bash
su -c 'am force-stop com.android.vending; am force-stop com.android.providers.downloads; am force-stop com.google.android.gms'
```

然后打开 Google Play，取消旧的等待任务，重新点安装。

## 总结

这次问题有三层：

1. 下载管理器里曾经残留一个只允许 Wi-Fi 且绑定旧网络的 Play 下载任务，需要删除。
2. Play 下载服务使用 Cronet，失败时界面会显示“等待中”，日志里实际是 `CANNOT_CONNECT (8)`。
3. 真正导致下载失败的域名是 `services.googleapis.cn`，它虽然属于 `.cn`，但应该走代理，不能被 `geosite:cn` 规则直连。

最有用的几条排查命令：

```bash
su -c 'content query --uri content://downloads/all_downloads'
su -c 'logcat -d -t 3000 | grep -Ei "Finsky|DownloadService|CronetDownloader|CANNOT_CONNECT|ERR_CONNECTION|ERR_QUIC"'
curl -I --connect-timeout 10 https://services.googleapis.cn
curl --socks5-hostname 127.0.0.1:10808 -I --connect-timeout 10 https://services.googleapis.cn
```

如果 `curl --socks5-hostname 127.0.0.1:10808` 都连不上，那就不是 v2rayNG 路由写法的问题，而是节点或服务端出站本身的问题。
