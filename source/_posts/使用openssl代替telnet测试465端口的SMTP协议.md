---
title: 使用openssl代替telnet测试465端口的SMTP协议
abbrlink: 36770
date: 2020-02-27 12:19:29
tags:
---

以163为例子，首先登录163的ssl服务器
```
 openssl s_client -connect smtp.163.com:465
 ```
 然后返回一堆东西
```
 CONNECTED(00000005)
depth=2 C = US, O = DigiCert Inc, OU = www.digicert.com, CN = DigiCert Global Root CA
verify return:1
depth=1 C = US, O = DigiCert Inc, OU = www.digicert.com, CN = GeoTrust RSA CA 2018
verify return:1
depth=0 C = CN, ST = Zhejiang, L = Hangzhou, O = "NetEase (Hangzhou) Network Co.,Ltd", OU = Game Dep., CN = *.163.com
verify return:1
---
Certificate chain
 0 s:C = CN, ST = Zhejiang, L = Hangzhou, O = "NetEase (Hangzhou) Network Co.,Ltd", OU = Game Dep., CN = *.163.com
   i:C = US, O = DigiCert Inc, OU = www.digicert.com, CN = GeoTrust RSA CA 2018
 1 s:C = US, O = DigiCert Inc, OU = www.digicert.com, CN = GeoTrust RSA CA 2018
   i:C = US, O = DigiCert Inc, OU = www.digicert.com, CN = DigiCert Global Root CA
---
Server certificate
-----BEGIN CERTIFICATE-----
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
0hQDr8J5
-----END CERTIFICATE-----
subject=C = CN, ST = Zhejiang, L = Hangzhou, O = "NetEase (Hangzhou) Network Co.,Ltd", OU = Game Dep., CN = *.163.com

issuer=C = US, O = DigiCert Inc, OU = www.digicert.com, CN = GeoTrust RSA CA 2018

---
No client certificate CA names sent
---
SSL handshake has read 3180 bytes and written 632 bytes
Verification: OK
---
New, TLSv1.2, Cipher is AES256-GCM-SHA384
Server public key is 2048 bit
Secure Renegotiation IS supported
Compression: NONE
Expansion: NONE
No ALPN negotiated
SSL-Session:
    Protocol  : TLSv1.2
    Cipher    : AES256-GCM-SHA384
    Session-ID: 53F682837FC83A0448F623001F0E265E7F9A962DA84017462F6991C22470DBFE
    Session-ID-ctx: 
    Master-Key: B9CD0D2882E1B5A473E4B46F409759733A108C1DBA881892C0E7A05EABB6D2CFD71DAC1F43FDBC8C3B7D584C073EC4FB
    PSK identity: None
    PSK identity hint: None
    SRP username: None
    TLS session ticket lifetime hint: 120 (seconds)
    TLS session ticket:
    0000 - 29 c6 40 a9 3d 54 4d 25-2a fa 54 30 6f 13 df 8f   ).@.=TM%*.T0o...
    0010 - 68 58 3b 37 4d 94 cc fd-84 07 f7 e7 83 35 92 12   hX;7M........5..
    0020 - 8f ce d2 d2 06 23 72 ca-5d e7 40 15 59 f1 ab 24   .....#r.].@.Y..$
    0030 - 66 07 b4 37 3b fe 04 7f-b0 36 e3 5e fe c9 97 8f   f..7;....6.^....
    0040 - c7 42 b8 7a 82 56 63 b0-6e 9f 60 8d 85 c1 4f 64   .B.z.Vc.n.`...Od
    0050 - bb 8d 92 79 af fe 3b c6-bd e9 16 ba d7 c7 1f 4b   ...y..;........K
    0060 - b2 31 ee 75 04 cb 52 7c-b7 06 62 e3 4f 44 08 b3   .1.u..R|..b.OD..
    0070 - 57 c8 6a 47 13 43 44 92-2f f1 51 3c 78 ed 42 b6   W.jG.CD./.Q<x.B.
    0080 - b9 93 69 42 a8 e5 bb 81-3d f5 f3 12 88 65 23 30   ..iB....=....e#0
    0090 - 90 ee 7b ea 79 a9 9e 44-31 69 1d 97 c9 9e 0d c5   ..{.y..D1i......
    00a0 - 4e 9b 24 2f 63 0a d2 18-1b 59 2d 63 a0 b5 9d dd   N.$/c....Y-c....

    Start Time: 1582775714
    Timeout   : 7200 (sec)
    Verify return code: 0 (ok)
    Extended master secret: no
---
220 163.com Anti-spam GT for Coremail System (163com[20141201])
 ```
 输入
 ```
 EHLO smtp.163.com
 ```
 返回
 ```
 250-mail
250-PIPELINING
250-AUTH LOGIN PLAIN
250-AUTH=LOGIN PLAIN
250-coremail 1Uxr2xKj7kG0xkI17xGrU7I0s8FY2U3Uj8Cz28x1UUUUU7Ic2I0Y2UFT7yzwUCa0xDrUUUUj
250-STARTTLS
250 8BITMIME

 ```
 输入
 ```
 AUTH LOGIN
 ```
 返回
 ```
 334 dXNlcm5hbWU6
 ```
 这个是base64编码，ctrl+z挂起当前进程，使用openssl命令可以解码,由于openssl只能操作文件，因此要从命令行输入只能使用管道运算符。
 ```
 echo dXNlcm5hbWU6| openssl base64 -d 
 ```
 返回
 ```
 username:
 ```
 意思就是让你输入用户名，当然你用户名也必须用base64输入，所以你得用base64编码一下：
 ```
  echo myemail@domain.com| openssl base64 -e
 ```
 返回
 ```
 bXllbWFpbEBkb21haW4uY29tCg==
 ```
 然后使用‘fg’命令切换回之前的进程
 把这个用户名输入，返回
 ```
 334 UGFzc3dvcmQ6
 ```
 同理解码之后知道是输入密码的意思，然后和前面的方法一样把密码通过base64编码之后再发过去即可。
