---
title: 最新git clone 克隆部分文件的方法
date: 2020-11-24 14:31:14
tags:
---

网上讲的sparse checkout方法并没有什么用，因为稀疏检出的方法依旧克隆了全部仓库的历史记录。
最新的git 2.19之后才能够实现克隆部分文件
参考了这个答主的方法：[https://stackoverflow.com/questions/600079/git-how-do-i-clone-a-subdirectory-only-of-a-git-repository/52269934#52269934](https://stackoverflow.com/questions/600079/git-how-do-i-clone-a-subdirectory-only-of-a-git-repository/52269934#52269934)
```bash
git clone \
  --depth 1 \
  --filter=blob:none \
  --no-checkout \
  https://github.com/cirosantilli/test-git-partial-clone \ # 仓库地址
;
cd test-git-partial-clone 
git checkout master -- d1 #这里的d1指的是文件或者目录

```
原理就是好像只下载了索引文件。
如果要clone某个分支或者commit的文件，只要在checkout检出那里设置就行了。
```
git checkout <branchname> -- d1
git checkout <commitid> -- d1

```
