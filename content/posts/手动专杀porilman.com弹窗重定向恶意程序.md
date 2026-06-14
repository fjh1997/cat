---
title: 手动专杀porilman.com弹窗重定向恶意程序
abbrlink: 60985
url: /posts/60985.html
date: 2019-04-08 10:26:01
tags:
---

@[TOC](手动专杀porlilman.com弹窗重定向恶意程序)

# 问题出现

计算机每隔一段时间就会用ie浏览器弹出一个网站名为 porilman.com，然后这个网站会自动重定向到一些病毒网站，显得十分烦人。比如这个网站要求你下载java，明显是病毒。
![在这里插入图片描述](/images/1e8b43747a681555e7022e8044ccd693.png)
![在这里插入图片描述](/images/ef9bb7e7d7d783bd5a02ab0370fa02e3.png)

## 解决思路
在任务管理器里查找这个ie浏览器的进程会发现，这是一个由命令行启动的程序。
![在这里插入图片描述](/images/0b74bca97ce06e41c98cdbb49742834f.png)
既然这样，那么问题来了，是谁调用这个命令启动的呢？
 
## 解决方案
在powershell中使用以下命令查找这个进程的父进程。比如由上图可知，这个进程的进程id是11996，那么通过该命令查找到父进程即可。

```powershell
  wmic process where ProcessId=11996 get ParentProcessId
```

返回结果：

```powershell
ParentProcessId
1428
```
在任务管理器里查看PID为1428的进程，会发现这个进程是Windows任务计划里的。![在这里插入图片描述](/images/62864359b3c29ec32b716065d1ff4996.png)
接下来就顺理成章了，在任务计划里找到一个名为OperaUpdateService的计划，就是这个计划导致了弹窗事件发生，把这个弹窗程序禁用即可。
![在这里插入图片描述](/images/94a92e94308138e603f5f9bcf717a051.png)
