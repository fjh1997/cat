---
title: macos python2 pwntools时出现有关unicorn问题的汇总
abbrlink: 28933
url: /posts/28933.html
date: 2020-08-24 21:23:09
tags:
---

最近在macos下安装python2版本的pwntools遇到两个问题，一个是安装依赖unicorn的时候遇到

> error: [Errno 2] No such file or directory: 'libunicorn.dylib'

解决方法是这个：

> https://github.com/unicorn-engine/unicorn/issues/1170

也就是换一个更新一点的unicorn依赖1.02rc1版本，1.0.1版本比较老，导致qemu版本不兼容
但是换了1.02rc1又会遇到这个问题

> TypeError: copy() got an unexpected keyword argument  'follow_symlinks'

解决方法是这个：

> https://github.com/unicorn-engine/unicorn/pull/1231/files

用这个pr修改setup.py就好，原因是1.02rc1～rc3安装脚本对python2不太支持,貌似rc4版本解决了这个问题，但是根据以下这个issue：

> https://github.com/Gallopsled/pwntools/issues/1538

这个版本又多了个bug，有关mips的plt表问题
所以最好的办法还是自己到这里下载1.02rc1～rc3的版本源码：


> https://pypi.org/simple/unicorn/


然后自己修改setup.py之后安装：



```bash
tar -zxf unicorn-1.0.2rc3.tar.gz
```
117行
```pyrhon
shutil.copy(file, LIBS_DIR, follow_symlinks=False)
```
改为
```python
try:
    shutil.copy(file, LIBS_DIR, follow_symlinks=False)
except:
    shutil.copy(file, LIBS_DIR)
```
之后安装就行了
```bash
python setup.py install
```


