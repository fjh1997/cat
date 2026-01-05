---
title: 如何将汇编语言转化为hex机器码
date: 2020-04-05 21:48:21
tags:
---


很简单，使用gcc即可，我们写如下程序：

```
pop eax
```
保存为文本文件，命名为test.s
然后使用gcc在32位的环境下编译
```
gcc test.s
```
结果会报错，为什么呢？

> /usr/bin/ld: /tmp/ccj87S8M.o: relocation R_X86_64_32S against undefined >symbol `eax' can not be used when making a PIE object; recompile with -fPIC
>/usr/lib/gcc/x86_64-linux-gnu/7/../../../x86_64-linux-gnu/Scrt1.o: In function `_start':
>(.text+0x20): undefined reference to `main'
>/usr/bin/ld: final link failed: Invalid operation
>collect2: error: ld returned 1 exit status

因为gcc默认汇编是要编译链接一气呵成的。这里我们使用参数-c，即可只编译不链接。
```bash
gcc -c test.s
```
这样就出来了一个test.o文件，里面只有pop eax的机器码，我们可以使用objdump -d查看。
```
objdump -d test.o

```
可以看到pop eax被转化为了popq，为什么呢？因为gcc采用的是AT&T 语法pop eax要写成pop %eax再编译才行
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/9d7ac168d94d31f14243a2120b9d145d.png)
既然gcc编译这个并不准确，那么有什么是准确的呢？我们可以采用nasm，nasm使用intel语法，兼容这个格式。
没安装的可以安装下，很快
```bash
apt install nasm
```
之后使用nasm编译这个文件
```bash
nasm -f elf32 test.s
```
之后生成的test.o文件就可以用objdump正常分析。
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/38e9d08a45ec2fbd8106e45d9deab9c3.png)
也可以用以下命令导出二进制格式的shellcode_32，相当于pwntools里的asm函数。

```bash
objcopy -O binary shellcode.o shellcode_32
```

我们也可以在objdump后面加-M intel来转化为intel语法，这种语法没有百分号。
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/70a94998965d62e0590af4b9493677d0.png)
除此之外，直接使用pwntools里面的函数似乎更加方便，比如
```python
from pwn import *
context.arch='i386' #指定架构,不然会报错
print(asm('mov eax, 0'))
```
结果
```
b'\xb8\x00\x00\x00\x00'

```
如果有报错没装binutil，请参考这个页面安装对应的，比如安装在Mac OS：
```bash
brew install https://raw.githubusercontent.com/Gallopsled/pwntools-binutils/master/osx/binutils-$ARCH.rb
```
这里的$ARCH一般只要填i386或者amd64就行了。
