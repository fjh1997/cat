---
title: 关于git clone无法克隆大文件的解决方法
date: 2019-06-27 19:10:37
tags:
---

最近在配置一个fakeface的项目https://github.com/DinoMan/speech-driven-animation
结果clone完文件安装好之后运行测试文件提示
```bash

Traceback (most recent call last):
  File "test.py", line 4, in <module>
    va = sda.VideoAnimator(gpu=0)# Instantiate the aminator
  File "/usr/local/lib/python3.6/dist-packages/sda-0.2-py3.6.egg/sda/sda.py", line 109, in __init__
    model_dict = torch.load(model_path, map_location=lambda storage, loc: storage.cuda(gpu))
  File "/usr/local/lib/python3.6/dist-packages/torch-1.1.0-py3.6-linux-x86_64.egg/torch/serialization.py", line 387, in load
    return _load(f, map_location, pickle_module, **pickle_load_args)
  File "/usr/local/lib/python3.6/dist-packages/torch-1.1.0-py3.6-linux-x86_64.egg/torch/serialization.py", line 564, in _load
    magic_number = pickle_module.load(f, **pickle_load_args)
_pickle.UnpicklingError: invalid load key, 'v'.

```
很明显是导入的文件出了问题，查看了下源码
```python
    if model_path == "grid":
        model_path = os.path.split(__file__)[0] + "/data/grid.dat"
    elif model_path == "timit":
        model_path = os.path.split(__file__)[0] + "/data/timit.dat"
    elif model_path == "crema":
        model_path = os.path.split(__file__)[0] + "/data/crema.dat"
```
跑去相关目录下一看，内容竟然是这个

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/4d34ff4f78e5560be36fc4fa742ec0aa.png)
这明明是个文本文件，而且大小也不对只有几k，导入这个文件，开头是v,当然会报错！于是我跑去github上一看
![](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/17e8ef9dc84779b4d511c1105f26cf4c.png)
这个文件实际大小所211MB 上面有一句话 Stored with Git LFS，这下我明白了，简而言之，git lfs 是git的一个拓展模块，专门用来保存大文件，所以要先安装git lfs 才行，不然普通的clone只会得到一个文件指针。
去官网上安装吧：https://git-lfs.github.com/
安装完之后，使用以下命令即可获得大文件
```bash
git lfs pull
```
另外为了写这篇文章，我在kali下截图费了好大的劲，部分区域的截图方法是ctrl+shift+printScreen，截屏后随便找个地方粘帖就行。
