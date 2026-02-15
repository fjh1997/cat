---
title: 通过命令行编译java的jar包
abbrlink: 17940
date: 2020-09-22 21:11:38
tags:
---

以Snow的源码为例，
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/c9f76032de5f414cbe6fc3f345fc00e8.png#pic_center)
在当前目录下使用命令

```bash
javac -d ./build *.java
```
可以看到java全部编译为class文件
之后打开在build目录下打开命令行

```bash
jar cvef Snow Jsnow.jar *
```
注意这里的e参数用于指定主启动类，这个程序里面主启动类是Snow，对应这里的Snow参数，如果不指定，可能会遇到。
".\Jsnow.jar中没有主清单属性"的错误
