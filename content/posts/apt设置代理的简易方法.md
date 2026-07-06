---
title: apt设置代理的简易方法
abbrlink: 42401
url: /posts/42401.html
date: 2026-03-02 10:22:46
tags:
---
apt设置代理，网上的方法都太复杂，实际上只要用环境变量即可：  
```bash
export http_proxy=http://127.0.0.1:10808
export https_proxy=http://127.0.0.1:10808
```
但是设置完不生效是为什么呢，因为apt往往要加sudo运行，而sudo会把之前的环境变量给重置掉。  
所以只要让sudo不重置，即可，那就是使用`sudo -E`即可
```
sudo -E apt update
```