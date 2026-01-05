---
title: 记一次curl不返回请求体response的问题，以及shell脚本调试技巧
date: 2020-12-01 16:15:17
tags:
---

一次使用curl测试接口结果返回了一下http头但没返回请求体
```bash
HTTP/1.1 200 
P3P: CP=CAO PSA OUR
Content-Encoding: gzip
Content-Type: text/html;charset=UTF-8
Transfer-Encoding: chunked
Date: Tue, 01 Dec 2020 08:01:30 GMT
Connection: close
```
仔细一看发现返回但格式是gzip
所以要想显示请求体就要加上"--compressed"参数

```bash
HTTP/1.1 200 
P3P: CP=CAO PSA OUR
Content-Encoding: gzip
Content-Type: text/html;charset=UTF-8
Transfer-Encoding: chunked
Date: Tue, 01 Dec 2020 08:02:00 GMT
Connection: close

{"success":true,"array":[]}
```
运维但时候用shell脚本写东西，调试起来比较吃力
比如你定义了一个shell 函数
```bash
submit(){
a=`curl $1 $2`
echo $a
}
```
然后使用这个函数

```bash
haha="-i"
papa="http://www.csdn.net"
submit $haha $papa
```
这个时候就比较难调试，如果在脚本开头加上`#!/bin/bash -x`
那么运行的时候就会显示如下:
```
+ haha=-i
+ papa=http://www.csdn.net
+ submit -i http://www.csdn.net
++ curl -i http://www.csdn.net
```
由于shell函数的本质是替换命令，所以使用bash -x的时候会把变量替换后执行的命令显示出来，这样就方便调试。
我们也可以直接在命令行里输入`bash -x`
这样，我们输入的命令替换的结果都能显示出来了。
一个普通的cd+tab的命令补齐功能就有这么多门道，看加号后面的那些。
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/c5a586fde2f034e0525fead81dc359f3.png#pic_center)

[参考了这个](https://stackoverflow.com/questions/2853803/how-to-echo-shell-commands-as-they-are-executed)
