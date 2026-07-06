---
title: 如何在windows WSL子系统中使用pwntools以及启用pwndbg
abbrlink: 59545
url: /posts/59545.html
date: 2020-04-14 13:49:39
tags:
---


很遗憾WSL默认使用64bit的程序，不支持32位的程序，我们在不使用QEMU的情况下只能调试64位的程序。但也可以使用一些手段来达到调试32位程序的目的：
### 0.安装QEMU，修改pwnlib
安装QEMU

```bash
sudo apt update
sudo apt install qemu-user-static
sudo update-binfmts --install i386 /usr/bin/qemu-i386-static --magic '\x7fELF\x01\x01\x01\x03\x00\x00\x00\x00\x00\x00\x00\x00\x03\x00\x03\x00\x01\x00\x00\x00' --mask '\xff\xff\xff\xff\xff\xff\xff\xfc\xff\xff\xff\xff\xff\xff\xff\xff\xf8\xff\xff\xff\xff\xff\xff\xff'
```
这个时候在命令行里面输入

```bash
qemu-i386-static
```
查看是否安装成功
之后修改文件

> /usr/local/lib/python3.6/dist-packages/pwnlib/context/\_\_init\_\_.py

在里面的native()函数中加入以下行：
```python
 if arch == 'i386':
                return False
```
![在这里插入图片描述](/images/3e7a145427af583a92e75812f0748a13.png)

之后调试32位程序的时候记得在脚本里面加上这句话就可以了：

```python
context.arch='i386'
```
同时要注意连接函数的写法不能是

```python
sh=process("./pwn")
gdb.attach(sh)
```
而要是：

```python
sh=gdb.debug("./pwn")
```

### 1.设置ubuntu默认root启动
进入目录

```cmd
cd C:\Users\hp\AppData\Local\Microsoft\WindowsApps
ubuntu1804.exe config --default-user root
```

### 2.修改ptrace设置
需要把下列文件里面的变量改成0（原来是1）
```bash
echo 0 > /proc/sys/kernel/yama/ptrace_scope 
```
或者
```bash
echo kernel.yama.ptrace_scope = 0 > /etc/sysctl.d/10-ptrace.conf #这个是持久化
```
### 3.下载WSL-terminal
[WSL-terminal](https://github.com/mskyaxl/wsl-terminal)
向环境变量PATH里面加入WSL-terminal所在目录。
### 4.按照pwntools和pwndbg
pwntools
```bash
apt-get update
apt-get install python3 python3-pip python3-dev git libssl-dev libffi-dev build-essential
python3 -m pip install --upgrade pip
python3 -m pip install --upgrade git+https://github.com/Gallopsled/pwntools.git@dev
```
pwndbg
```bash
git clone https://github.com/pwndbg/pwndbg
cd pwndbg
./setup.sh

```
### 5.编写pwn脚本
之后的pwn脚本都要添加下面这些话：
```python
from pwn import *
context.arch='i386' #如果是32位要加这个
context.terminal=["open-wsl.exe","-c"] #注意这句
sh=process("./pwn")
gdb.attach(sh)
```
或者
```python
from pwn import *
context.arch='i386' #如果是32位要加这个
context.terminal=["open-wsl.exe","-c"] #注意这句
sh=gdb.debug("./pwn")
```

如果open-wsl.exe不太好装可以使用以下脚本：

```python
from pwn import *
context.terminal=["cmd.exe","/c", "start", "cmd.exe", "/c", "wsl.exe", "-e"]
r=gdb.debug("./main")
#r=remote("10.30.17.67",20000)

payload= b'a'*32 + p32(0x08049210)
r.sendline(payload)
r.interactive()

```



### 6.动态调试
之后就可以愉快的动态调试了
64位
![在这里插入图片描述](/images/6a8545e1ee7bd4f95d5db6ab8584ef96.png)
32位
![在这里插入图片描述](/images/f17607cf81310ae7b8d2387fe3981a48.png)
