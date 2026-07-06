---
title: MacOs 上面安装pwntools
abbrlink: 38606
url: /posts/38606.html
date: 2020-01-17 23:15:50
tags:
---

官方的教程有些问题
```sh
python3 -m pip install --upgrade git+https://github.com/Gallopsled/pwntools.git@dev3
```
会出现以下错误：
>  error: [Errno 2] No such file or directory: 'libunicorn.dylib'

应该改为以下即可安装成功
```sh
wget https://files.pythonhosted.org/packages/7d/7f/47fe864fe967e91de2d57677618cffc91bee3918f0a3cdbaa6500b36855e/unicorn-1.0.1.tar.gz
tar -zxf unicorn-1.0.1.tar.gz
cd unicorn-1.0.1
cp /usr/local/opt/unicorn/lib/lib* ./prebuilt
python3 setup.py install
pip3 install --upgrade git+https://github.com/Gallopsled/pwntools.git@dev3 --user

```
原因是环境变量冲突，MacOS官方的pip和python对应的lib和brew下安装的lib不一样
参考：https://www.cnblogs.com/flatcc/p/11991917.html
