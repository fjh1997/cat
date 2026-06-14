---
title: 通过修改根证书绕过rustls的证书固定机制，抓包解密ssl流量
abbrlink: 46107
url: /posts/46107.html
date: 2023-05-08 17:54:47
tags:
---

例子，cloudflare的warp-svc.exe。抓包获取密钥。
用proxifier尝试了一下强行代理，无效，因为proxifier是通过Hook Socket函数方式实现的，但这个程序可能没有用Socket函数进行通信。
之后发现通过nekoray基于gvisor的VPN白名单模式全局路由可以强制代理。但发现MITMproxy抓不了包而且在Event Log返回sslv3 alert bad certificate。
![在这里插入图片描述](/images/e7160cb785c00475c50fa9bda94e8bf2.png)
这说明warp-svc.exe在和MITMproxy 进行ssl握手的时候发现MITMproxy 的证书不对，然后就向MITMproxy发送sslv3 alert 信息然后中断连接。问题是，我已经将MITMproxy 的证书存储到windows的根证书目录里面，但仍然出现这种情况，说明warp-svc.exe内部固定了证书发行机构。

尝试了google的ssl_log，无效，ssl_log的原理是hook openssl库，可能这个程序没有用openssl库来处理tls。
过IDA pro查看发现有很多cargo的字样，猜测是rust写的。进一步搜索alert 发现一个字符串"Sending warning alert"，网上一查发现是rustls库里的字符串，那么就从rustls入手。
先从bad certificate开始搜索rustls的源码，由于[bad certificate](https://www.ibm.com/docs/en/developer-for-zos/9.1.1?topic=trace-ssl-alert-messages)在ssl握手里的序号是42，
![在这里插入图片描述](/images/8602e127952b1e8ba92d1cbfa15834ea.png)
42是0x2a,先搜索0x2a
![在这里插入图片描述](/images/a1d83685cb2b336893ae00a6cb71af0f.png)
发现是个枚举类型，接着搜索BadCertificate发现有三种类型对应这个alertBadEncoding | UnhandledCriticalExtension | NotValidForName

![在这里插入图片描述](/images/7dea910803ed1e16f7a50dd1dba010f6.png)
前面两个错误不太可能发生，那么NotValidForName最可能，接着搜索发现在pkierror里面：
![在这里插入图片描述](/images/8c0b722b0b13c92a9e0b74dee65e5806.png)
接着搜索pki_error
![在这里插入图片描述](/images/867d925b9c73e8259bc985ef6f2950a6.png)
发现确实有固定证书的情况，就是self.roots的这个变量。发现确实内部固定了根证书：

![在这里插入图片描述](/images/00c00013c3ec024ebc031f1ac55db33b.png)

接着搜索RootCertStore,发现在anchors命名空间里

![在这里插入图片描述](/images/7bb0b7868907e532ea198331716ec866.png)

去anchors命名空间里翻找发现结构体RootCertStore是OwnedTrustAnchor类型是vector数组
![在这里插入图片描述](/images/b4902e97062367ac841f0e21b5f58f4c.png)
接着搜索OwnedTrustAnchor找到它的结构体
![在这里插入图片描述](/images/9cabfd144b5520b42c2225cffe8b7614.png)
那么RootCertStore 是从哪里赋值的呢？代码里没搜到，通过readme可以看到，example里面有个tlsclient-mio.rs，应该是调用rustls的例子：![在这里插入图片描述](/images/e76fe50910a01d760fc41edefea319fe.png)
从里面可以看到RootCertStore 被webpki_roots::TLS_SERVER_ROOTS所赋值，于是去寻找webpki_roots发现确实有这样一个项目，这个项目里面有个脚本build.py，生成了src/lib.rs文件，进入这个文件一看：
![在这里插入图片描述](/images/3a3c71a49808d657aabcf41003770c5b.png)
发现根证书的存储方式是存储subject和spki，这两个值通过src/bin
/process_cert.rs这个程序处理证书然后生成，通过cargo build之后在target文件夹里面生成的process_cert.exe文件。


其中每个证书的spki大小都只有几种，而subject大小不一样。去IDA里面搜索subject代表的二进制数值，果然搜到了。

![在这里插入图片描述](/images/df68bb3374903c729e59970e1bb88472.png)


之后的思路就简单了，直接用openssl生成一个相同大小subject和spki的的证书然后使用process_cert.exe提取出来，再使用010editor替换目标程序warp-svc.exe里面的字节串即可。一个简单的方法是使用与你的目标域名的签发机构根证书相同的生成信息，比如api.cloudflareclient.com的根证书是Baltimore CyberTrust Root，提取出来后使用命令

```bash
 openssl x509 -in '.\Baltimore CyberTrust Root.crt' -noout -text
```
得到它的subject：

```bash
 Subject: C = IE, O = Baltimore, OU = CyberTrust, CN = Baltimore CyberTrust Root
```
然后使用openssl生成subject一模一样的证书
```bash
openssl genrsa -out ca.key 2048
openssl req -new -x509 -key ca.key -out ca.crt
#按照之前提取的信息填写
cat ca.key ca.crt >mitmproxy-ca.pem
```
最后用process_cert.exe处理这个证书提取出二进制格式的subject和spki并使用010editor替换目标程序warp-svc.exe里面的字节串。

将这个证书安装到系统根证书目录以及mitmproxy的根证书目录`C:\Users\用户名\.mitmproxy`之后就能抓包解密流量了，需要注意的是如果抓不到包，则可能是因为域名解析的地址是ipv6的因为nekoray里的ipv6vpn有些bug。

