---
title: 关于pip安装了module之后用python运行还是提示no module的解决办法
abbrlink: 24980
date: 2019-06-26 12:36:06
tags:
---


今天尝试运行一个python脚本，里面有这样一段话
```python
import torchvision
```
```bash
sudo python3 test.py
```
结果提示
no module named "torchvision"
这种情况，果断pip安装torchvision
```bash
pip3 install test.py
```
然后再次运行脚本
```bash
sudo python3 test.py
```
结果还是提示no module named "torchvision"
去掉 sudo
```bash
python3 test.py
```
结果可以了。
分析原因：加了sudo 的pip安装包是安装在全局路径，加了sudo的python寻找库也是从全局路径中寻找，所以不加sudo的pip安装的module无法在加了sudo命令运行的python中找到。
解决办法:使用sudo pip 安装
```bash
sudo pip3 install test.py
```
## 注意：
还有一种情况是你把python文件命名为base64.py或者string.py、torchvision.py诸如此类和包名冲突的文件名，这个时候你需要将文件名重命名同时把当前目录下的pyc文件删掉（因为python把你的文件当作库来编译pyc了）
