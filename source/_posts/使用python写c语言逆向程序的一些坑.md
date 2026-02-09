---
title: 使用python写c语言逆向程序的一些坑
abbrlink: 46557
date: 2020-08-21 19:10:40
tags:
---

比如IDA里面这样一个程序要逆向：
![截屏2020-08-21 下午7.01.09](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/781d92e236b62d52e63bd36e140d39d2.png#pic_center)
其中关键代码

```c
 int result; // eax
  char v4; // [rsp+1Dh] [rbp-13h]
  char v5; // [rsp+1Eh] [rbp-12h]
  char v6; // [rsp+1Fh] [rbp-11h]
  FILE *v7; // [rsp+20h] [rbp-10h]
  FILE *stream; // [rsp+28h] [rbp-8h]
 v4 = 34;
  v5 = 0;
  v7 = fopen(argv[1], "rb");
  if ( v7 )
  {
    stream = fopen(argv[1], "rb+");
    if ( stream )
    {
      while ( 1 )
      {
        v6 = fgetc(v7);
        if ( v6 == -1 )
          break;
        fputc(v4 ^ (v5 + v6), stream);
        v4 += 34;
        v5 = (v5 + 2) & 0xF;
      }
      fclose(v7);
      fclose(stream);
      result = 0;
    }
```
在逆向为python的时候要注意以下两点：
1.符号优先级
2.整数（字节）溢出
由于v4是一个char类型的数据，因此它的最大值不超过255，而每次循环它加了34，因此在超过255之后c语言的程序会溢出并舍弃最高位，但python不会，因此每次给v4+34之后要&0xff也就是255
```python
v4=v4+34&255
```
有人可能奇怪，为什么不这样写。
```python
v4=(v4+34)&255
```
事实上在python里+的优先级比&要高，所以括号可有可无。
同理逆向的时候(假如c是密文，m是明文)
要加个括号才是先c异或v4再减去v5：
```python
m=(c^v4)-v5
```
如果不加的话：
```python
m=c^v4-v5
```
就是v4先减v5再异或c

因此逆向脚本如下：

```python
v4=34
v5=0
c=''
f=open("./233.txt",'rb')
buff=f.read()
for i in buff:
	c=c+chr((i^v4)-v5) #注意括号
	v4=(v4+34)&0xff #注意溢出
	v5=(v5+2)&0xf
print(c)
```
关于python符号优先级可以看这里：
https://www.runoob.com/python/python-operators.html#ysf8

