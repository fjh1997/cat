---
title: 记录EPIC-game出现AS-3错误问题的排查
abbrlink: 13165
url: /posts/13165.html
date: 2026-01-13 21:18:18
tags:
---

登录的时候出现了这个问题，使用雷神加速器还是不行，查看了下日志，发现如下问题：
```
[2026.01.13-12.05.45:338][  0]LogOnlineIdentity: OSS: Sending Login request. url=https://account-public-service-prod03.ol.epicgames.com/account, type=refresh, id=[REDACTED]
[2026.01.13-12.05.45:349][  0]LogInit: Using libcurl 7.55.1-DEV
[2026.01.13-12.05.45:349][  0]LogInit:  - built for x86_64-pc-win32
[2026.01.13-12.05.45:350][  0]LogInit:  - supports SSL with OpenSSL/1.1.1
[2026.01.13-12.05.45:350][  0]LogInit:  - supports HTTP deflate (compression) using libz 1.2.8
[2026.01.13-12.05.45:350][  0]LogInit:  - other features:
[2026.01.13-12.05.45:350][  0]LogInit:      CURL_VERSION_SSL
[2026.01.13-12.05.45:350][  0]LogInit:      CURL_VERSION_LIBZ
[2026.01.13-12.05.45:350][  0]LogInit:      CURL_VERSION_IPV6
[2026.01.13-12.05.45:350][  0]LogInit:      CURL_VERSION_ASYNCHDNS
[2026.01.13-12.05.45:350][  0]LogInit:      CURL_VERSION_LARGEFILE
[2026.01.13-12.05.45:350][  0]LogInit:      CURL_VERSION_IDN
[2026.01.13-12.05.45:350][  0]LogInit:  CurlRequestOptions (configurable via config and command line):
[2026.01.13-12.05.45:350][  0]LogInit:  - bVerifyPeer = true  - Libcurl will verify peer certificate
[2026.01.13-12.05.45:350][  0]LogInit:  - bUseHttpProxy = true  - Libcurl will use HTTP proxy
[2026.01.13-12.05.45:350][  0]LogInit:  - HttpProxyAddress = '127.0.0.1:52345'
[2026.01.13-12.05.45:350][  0]LogInit:  - bDontReuseConnections = false  - Libcurl will reuse connections
[2026.01.13-12.05.45:350][  0]LogInit:  - MaxHostConnections = 0  - Libcurl will NOT limit the number of connections to a host
[2026.01.13-12.05.45:350][  0]LogInit:  - LocalHostAddr = Default
[2026.01.13-12.05.45:350][  0]LogInit:  - BufferSize = 524288
[2026.01.13-12.07.11:083][924]LogOnline: Warning: OSS: https://launcher-public-service-prod06.ol.epicgames.com/launcher/api/public/assets/v2/platform/Windows/launcher?label=Live-HighlandWarrior&clientVersion=17.2.0-38549760%2B%2B%2BPortal%2BRelease-Live-Windows&machineId=44bfe7a8465be3cf51b9abb69b28456a
[2026.01.13-12.07.11:083][924]LogOnline: Warning: OSS: Response:
[2026.01.13-12.07.11:083][924]LogOnline: Warning: OSS: 连接服务器失败。
[2026.01.13-12.07.11:083][924]LogInit: AllCheckComplete SelfUpdate=0 SignedIn=0 RequiresRestart=0
[2026.01.13-12.07.12:820][976]LogHttp: Warning: 000001D76E82EDC0: invalid HTTP response code received. URL: https://account-public-service-prod03.ol.epicgames.com/account/api/oauth/token, HTTP code: 0, content length: 0, actual payload size: 0
[2026.01.13-12.07.12:820][976]LogHttp: Warning: 000001D76E82EDC0: request failed, libcurl error: 35 (SSL connect error)
[2026.01.13-12.07.12:820][976]LogHttp: Warning: 000001D76E82EDC0: libcurl info message cache 0 (Found bundle for host account-public-service-prod03.ol.epicgames.com: 0x1d774b4fc40 [serially])
[2026.01.13-12.07.12:820][976]LogHttp: Warning: 000001D76E82EDC0: libcurl info message cache 1 (Hostname 127.0.0.1 was found in DNS cache)
[2026.01.13-12.07.12:820][976]LogHttp: Warning: 000001D76E82EDC0: libcurl info message cache 2 (  Trying 127.0.0.1...)
[2026.01.13-12.07.12:820][976]LogHttp: Warning: 000001D76E82EDC0: libcurl info message cache 3 (TCP_NODELAY set)
[2026.01.13-12.07.12:820][976]LogHttp: Warning: 000001D76E82EDC0: libcurl info message cache 4 (Connected to 127.0.0.1 (127.0.0.1) port 52345 (#4))
[2026.01.13-12.07.12:820][976]LogHttp: Warning: 000001D76E82EDC0: libcurl info message cache 5 (allocate connect buffer!)
[2026.01.13-12.07.12:820][976]LogHttp: Warning: 000001D76E82EDC0: libcurl info message cache 6 (Establish HTTP proxy tunnel to account-public-service-prod03.ol.epicgames.com:443)
[2026.01.13-12.07.12:820][976]LogHttp: Warning: 000001D76E82EDC0: libcurl info message cache 7 (Proxy replied OK to CONNECT request)
[2026.01.13-12.07.12:820][976]LogHttp: Warning: 000001D76E82EDC0: libcurl info message cache 8 (CONNECT phase completed!)
[2026.01.13-12.07.12:820][976]LogHttp: Warning: 000001D76E82EDC0: libcurl info message cache 9 (ALPN, offering http/1.1)
[2026.01.13-12.07.12:820][976]LogHttp: Warning: 000001D76E82EDC0: libcurl info message cache 10 (Cipher selection: ALL:!EXPORT:!EXPORT40:!EXPORT56:!aNULL:!LOW:!RC4:@STRENGTH)
[2026.01.13-12.07.12:820][976]LogHttp: Warning: 000001D76E82EDC0: libcurl info message cache 11 (TLSv1.3 (OUT), TLS handshake, Client hello (1):)
[2026.01.13-12.07.12:820][976]LogHttp: Warning: 000001D76E82EDC0: libcurl info message cache 12 (CONNECT phase completed!)
[2026.01.13-12.07.12:820][976]LogHttp: Warning: 000001D76E82EDC0: libcurl info message cache 13 (CONNECT phase completed!)
[2026.01.13-12.07.12:820][976]LogHttp: Warning: 000001D76E82EDC0: libcurl info message cache 14 (OpenSSL SSL_connect: SSL_ERROR_SYSCALL in connection to account-public-service-prod03.ol.epicgames.com:443 )
```
很明显是libcurl走代理了目标地址是127.0.0.1:52345，但是系统里面又没有设置全局的系统代理，之后使用netstat查了一下发现是xray.exe在监听。
![20260113212448](/images/20260113212448.png)
通过排查发现是v2raya服务启动的，关掉这个之后就能正常连通了，虽然没找到v2raya是在哪里修改libcurl的代理的。
