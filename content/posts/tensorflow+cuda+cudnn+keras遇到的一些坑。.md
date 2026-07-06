---
title: tensorflow+cuda+cudnn+keras遇到的一些坑。
abbrlink: 42764
url: /posts/42764.html
date: 2023-07-16 17:22:41
tags:
---

最近配置RNN深度学习的时候装环境遇到不少错误如下：
> ImportError: cannot import name 'Dense' from 'keras.layers' (unknown location)

> DNN library is not found.

错误的解决方法，简单来说就是tensorflow和cuda以及cudnn，keras还有nvidia驱动之间的版本要对应，参考[这个](https://www.tensorflow.org/install/source#gpu)
|Version	|Python version	|Compiler|	Build tools	|cuDNN|	CUDA
|---|---|---|---|---|---|
|tensorflow-2.13.0|	3.8-3.11|	Clang 16.0.0|	Bazel 5.3.0|	8.6	|11.8|
|tensorflow-2.12.0|	3.8-3.11|	GCC 9.3.1|	Bazel 5.3.0|	8.6|	11.8|
|tensorflow-2.11.0|	3.7-3.10|	GCC 9.3.1|	Bazel 5.3.0|	8.1|	11.2

因此安装的时候最好指定版本安装：

```bash
pip install tensorflow==2.11.0
pip install keras==2.11.0 #keras与tensorflow必须一样
```

驱动则是安装cuda的时候会自带。安装自带版本即可。
但是也会存在一些问题，就是电脑上同时安装了多个CUDA版本的库，同时也安装了多个cudnn的库，导致即使安装了正确的库也没有办法正确识别。
如：

> loaded runtime cudnn library 8.0.5 but source was compiled with 8.1.0

这个时候就要使用`ldconfig -v|grep cudnn` 来查看系统里具体链接的版本：

```bash
 libcudnn.so.8 -> libcudnn.so.8.1.0
  libcudnn.so.8 -> libcudnn.so.8.0.5

```
如上所示是既有链接到8.1.0的也有链接到8.0.5的。
这个时候就要去看看：

```bash
cat /etc/ld.so.conf
include /etc/ld.so.conf.d/*.conf
```

```bash
ls /etc/ld.so.conf.d/
cuda-11-0.conf fakeroot-x86_64-linux-gnu.conf x86_64-linux-gnu.conf 
cuda-11-1.conf i386-linux-gnu.conf 
cuda-11-2.conf libc.conf
```
可以看到有很多conf，删掉其中不需要的cuda-11-1.conf和cuda-11-0.conf 然后重新执行`ldconfig`命令链接，之后使用`ldconfig -v|grep cudnn`确保链接到8.1.0。
有时候会遇到这样的问题


> Failed to call ThenRnnForward with model config: [rnn_mode,
> rnn_input_mode, rnndirection_mode]:
> 3,0,0,[num_layers,input_size,num_units,dir_count,max_seq_length,batch_size，
> cell_num_units]: [1，96，32，1，83，128，0]

这个是因为安装了8.1.1版本的cudnn而tensorflow 2.11.0匹配的是 8.1.0。尽管根据semantic version的定义相差0.0.1只是补丁的区别，但实际上也会出现问题。
