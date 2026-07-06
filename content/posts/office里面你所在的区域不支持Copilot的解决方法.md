---
title: office里面你所在的区域不支持Copilot的解决方法
abbrlink: 40329
url: /posts/40329.html
date: 2026-02-10 00:01:30
tags:
---
最近了一年office 365的[羊毛](https://www.nodeseek.com/post-589290-1),想试用copilot的时候遇到这个问题：  
![7a17103e89cc7a2e6d4eb65d8b0c2436](/images/7a17103e89cc7a2e6d4eb65d8b0c2436.png)  
梯子开了美国全局tun也没用，之后怀疑是缓存问题，因为一开始没开梯子导致加载了中国区的js文件，所以没法用  
用[微软官方网站](https://learn.microsoft.com/zh-cn/office/dev/add-ins/testing/clear-cache)上的方法试了下清缓存：  
删除以下文件夹的内容  
```
%LOCALAPPDATA%\Microsoft\Office\16.0\Wef\
```
之后保持美国全局tun重启word即可：  
![20260210000843](/images/20260210000843.png)
如果还是不行，可以尝试office 365的网页版，也能用Copilot
