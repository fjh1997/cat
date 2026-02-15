---
title: 手把手教你编译wireshark3.1的c语言插件（windows平台2019-3-20）
abbrlink: 57122
date: 2019-03-20 13:46:16
tags:
---

# 手把手教你编译wireshark3.1的c语言插件（windows平台2019-3-20）
>资料来源：<p>https://www.wireshark.org/docs/wsdg_html_chunked/ChSetupWin32.html （官方教程）
http://eucifyy.com/wireshark-dissector-mwe.html  （python代码）


## 简介
wireshark是一个著名的网络嗅探软件，前阵子央视著名的315晚会也有一个教授使用wireshark向我们展示某些不法app非法获取用户隐私的过程。在wireshark中用户可以自行编写插件来做自定义的协议的解析器。有两种途径，一种是c插件的方式，在windows平台下，体现为一个动态链接库.dll文件，放在wireshark插件目录下，这个c插件的优点是速度快，但缺点也很明显，编译工程量大，兼容性差，你这个版本下编译的插件，到另一个版本的wireshark下就完全不能用了。还有一个是lua脚本的方式，这个十分方便，兼容性也好，制作也简单，网上教程也一大堆，但不知道为什么，wireshark官方并不推荐这个。总之，我们还是按照wireshark官方的教程来编译c插件吧。
## 步骤一、编译一次wireshark源码
这个步骤十分繁琐，但好在官方写的十分详细：https://www.wireshark.org/docs/wsdg_html_chunked/ChSetupWin32.html。
按照官方说好的编译完一遍。这样你就安装好了环境，同时编译出了不少目标文件，这些目标文件待会编译插件的时候要用。
## 步骤二、编译c插件
### 1.创建源文件
按照这个https://www.wireshark.org/docs/wsdg_html_chunked/ChDissectAdd.html
创建wireshark\plugins\epan\foo目录，并在里面写出packet-foo.c文件（这个foo是你的插件名）

```c
#include "config.h"

#include <epan/packet.h>

#define FOO_PORT 1234

static int proto_foo = -1;

static int dissect_foo(tvbuff_t *tvb, packet_info *pinfo, proto_tree *tree _U_, void *data _U_)
{
    col_set_str(pinfo->cinfo, COL_PROTOCOL, "FOO");
    /* Clear out stuff in the info column */
    col_clear(pinfo->cinfo,COL_INFO);

    return tvb_captured_length(tvb);
}


void proto_register_foo(void)
{
    proto_foo = proto_register_protocol (
        "FOO Protocol", /* name       */
        "FOO",      /* short name */
        "foo"       /* abbrev     */
        );
}
void proto_reg_handoff_foo(void)
{
    static dissector_handle_t foo_handle;

    foo_handle = create_dissector_handle(dissect_foo, proto_foo);
    dissector_add_uint("udp.port", FOO_PORT, foo_handle);
}


```
### 2.复制其他插件文件作为模板
之后将wireshark\plugins目录下的plugin.rc.in文件复制进foo目录，以及wireshark\plugins\epan\gryphon目录下的CMakeLists.txt也复制进foo目录。
### 3.修改插件信息
使用记事本打开CMakeLists.txt，将里面的“gryphon”文本都替换为foo。
### 4.修改自制插件配置
进入wireshark目录，把里面的“CMakeListsCustom.txt.example”重命名为“CMakeListsCustom.txt”，打开CMakeListsCustom.txt，去掉里面的某个"#"，使得"set(CUSTOM_PLUGIN_SRC_DIR	plugins/epan/foo)"这样一个语句完整，这里的plugins/epan/foo就是你的插件的目录。
```cmake
set(CUSTOM_PLUGIN_SRC_DIR
	plugins/epan/foo
)

# Do not fail CMake stage if any of the optional plugins are missing from source tree
set(_OPTIONAL_CUSTOM_PLUGIN_SRC_DIR
	plugins/epan/bar
)

foreach(  _plugin_dir ${_OPTIONAL_CUSTOM_PLUGIN_SRC_DIR} )
	if( EXISTS ${CMAKE_CURRENT_SOURCE_DIR}/${_plugin_dir}/CMakeLists.txt )
		list( APPEND CUSTOM_PLUGIN_SRC_DIR ${_plugin_dir} )
	else()
		message( WARNING "Custom plugins: No ${_plugin_dir}/CMakeLists.txt file found - ignoring" )
	endif()
endforeach()
```
## 步骤四、重新编译wireshark源码
这次的重新编译，比初次编译要快不少，原因就是初次编译以及生成了足够了目标文件，这次编译只要编译你这个插件就行了。
编译完后你会在你的build目录下run\RelWithDebInfo\plugins\3.1\epan里看到foo.dll，这样就算编译成功了。
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/9944210a9a69070c7b2c52cb983f367b.jpeg)
## 步骤五、启动wireshark并测试
启动run\RelWithDebInfo下的wireshark.exe,使用python写一个基于foo协议的程序并测试，脚本如下：
```python
# server.py
from socket import *

serverSocket = socket(AF_INET, SOCK_DGRAM) # UDP
serverSocket.bind(('', 1234))

while True:
	message, address = serverSocket.recvfrom(1024) # buffer size
	serverSocket.sendto('thanks', address)
```
```python
# client.py
import time
from socket import *

clientSocket = socket(AF_INET, SOCK_DGRAM)
clientSocket.settimeout(1)
message = 'test'
addr = ('127.0.0.1', 1234)

start = time.time()
clientSocket.sendto(message, addr)
try:
	data, server = clientSocket.recvfrom(1234)
	end = time.time()
	elapsed = end - start
	print '%s %d' % (data, elapsed)
except timeout:
	print 'REQUEST TIMED OUT'
```
注意以上脚本必须用python2来运行，如果你已经安装了python3，你可以再安装一个python2并在bin目录里面添加如下内容的python2.bat：
```batch 
@echo off
%~dp0/python.exe %*
```
将bin目录添加到环境变量path即可通过python2命令执行python2。
还需要注意的是，按照默认配置编译的wireshark并不支持监听127.0.0.1这种本机回环地址。你需要安装一个Npcap loopback adapter  (https://nmap.org/download.html) 来使得wireshark能够监听该地址。
分别打开两个终端执行如下命令
```cmd
>python2 server.py
>python2 client.py
```
如果以上命令成功，你的client窗口会收到一个thanks的返回结果，你可以通过过滤器设置udp.port==1234来获得类似如下嗅探结果（为了测试，我没有采用本机回环地址，而是将server在另一台机子上执行）：
a'z![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/aacaa4bfb5f949662bb09ce20e47fc1f.jpeg)
这样，一个wireshark的c语言插件就初步编好了，需要更加详细的协议解析器（dissector）编程方法，可以去看官方的技术文档：https://www.wireshark.org/docs/wsdg_html_chunked/ChDissectAdd.html
