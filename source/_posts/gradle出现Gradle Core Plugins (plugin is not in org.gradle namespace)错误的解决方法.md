---
title: gradle出现Gradle Core Plugins (plugin is not in org.gradle namespace)错误的解决方法
abbrlink: 44280
date: 2020-06-16 22:53:59
tags:
---

今天尝试不用ide，在命令行中启动gradle，结果遇到了这样的错误：

```
Plugin [id: 'org.gradle.kotlin.kotlin-dsl', version: '1.3.4'] was not found in any of the following sources:

- Gradle Core Plugins (plugin is not in 'org.gradle' namespace)
- Plugin Repositories (could not resolve plugin artifact 'org.gradle.kotlin.kotlin-dsl:org.gradle.kotlin.kotlin-dsl.gradle.plugin:1.3.4')
  Searched in the following repositories:
    Gradle Central Plugin Repository
```
一开始没什么头绪，其中plugin is not in 'org.gradle' namespace这句话格外显眼，我十分郁闷，org.gradle.kotlin.kotlin-dsl按理说也不会是这样的啊，他的前缀不就是org.gradle么，怎么会namespace不符呢？
搞了好半天，最后使用gradle --info来调试，发现这个错误：

```
Evaluating project ':buildSrc' using build file '/Users/fjh1997/mirai/buildSrc/build.gradle.kts'.
I/O exception (org.apache.http.NoHttpResponseException) caught when processing request to {tls}->http://127.0.0.1:1083->https://plugins.gradle.org:443: The target server failed to respond
Retrying request to {tls}->http://127.0.0.1:1083->https://plugins.gradle.org:443
I/O exception (org.apache.http.NoHttpResponseException) caught when processing request to {tls}->http://127.0.0.1:1083->https://plugins.gradle.org:443: The target server failed to respond
Retrying request to {tls}->http://127.0.0.1:1083->https://plugins.gradle.org:443
I/O exception (org.apache.http.NoHttpResponseException) caught when processing request to {tls}->http://127.0.0.1:1083->https://plugins.gradle.org:443: The target server failed to respond
Retrying request to {tls}->http://127.0.0.1:1083->https://plugins.gradle.org:443

```
根据这个错误，gradle下载包的时候经过来本地1083的代理。但是我寻思着也没有用代理啊，于是就打开这个项目里面的gradle.properties看了一下：
```
systemProp.http.proxyHost=127.0.0.1
systemProp.http.proxyPort=8118
systemProp.https.proxyHost=127.0.0.1
systemProp.https.proxyPort=8118
```
我代理明明设置的是本地8118端口，为什么他给我走1083端口了呢？
想了一想，打开android studio一看，果然里面是我曾经设置的1083端口，当然现在已经不用了。
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/fc2db1b60e73f6c7bbb3a0e42c3d7164.png)
问题就在这里，尽管我没有用android studio但gradle，而用的是自己从gradle官网上下载的gradle，但安卓还是把这个独立于gradle的通信劫持了。不得不佩服这个IDE的强大。经过仔细的排查，发现gradle是有全局配置的，在～/.gradle/gradle.properties里面，而不是在这个项目的gradle.properties里面。
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/253ef2485bce68df7b2ab8d707d92aa1.png)
发现了罪魁祸首，就解决问题了！
