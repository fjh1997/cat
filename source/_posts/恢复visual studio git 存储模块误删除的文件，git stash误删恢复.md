---
title: 恢复visual studio git 存储模块误删除的文件，git stash误删恢复
date: 2020-06-26 19:21:42
tags:
---

最近不得已用了IDE开发，在使用里面的git的时候不知道怎么commit，然后瞎点了个储藏，然后发现我的所有代码都不见了，为了恢复文件，我又不小心点了全部删除，之后代码就真的全没了2333
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/8d52277601992ae194a2b680eba53885.png)
从网上了解到，储藏这个机制在git里面对应git stash，用于临时存储一些文件，保存状态，那么不小心删除的stash怎么恢复呢？方法如下：

```bash
git stash apply $stash_hash
```
至于这里的 $stash_hash怎么找，windows和linux里面有不同的方法：
在linux中：

```bash
git fsck --no-reflog | awk '/dangling commit/ {print $3}'

```
在windows 的powershell中：

```bash
git fsck --no-reflog | select-string 'dangling commit' | foreach { $bits = $_ -split ' '; echo $bits[2];}

```

