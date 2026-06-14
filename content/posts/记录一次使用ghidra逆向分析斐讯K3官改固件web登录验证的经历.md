---
title: 记录一次使用ghidra逆向分析斐讯K3官改固件web登录验证的经历
abbrlink: 49226
url: /posts/49226.html
date: 2021-03-05 16:07:20
tags:
---

写在前面：**逆向工程小白，仅供参考，如有错误，欢迎指正**。
实验室有台K3C路由器，趁老师不在，逆向玩玩。听老师说这个固件是官改，就去网上查查有没有相关固件。


固件地址：https://download.csdn.net/download/fjh1997/15566880
备份：https://www.right.com.cn/forum/thread-318971-1-1.html http://iytc.net/tools/k3c_v121_fs.bin

![在这里插入图片描述](/images/069cdaa26390eaa8697d3cf929ed0d6a.png#pic_center)
使用binwalk提取固件内的根文件系统：
```python
wget http://iytc.net/tools/k3c_v121_fs.bin
binwalk -M -d -e k3c_v121_fs.bin 
#注意要加-M表示Recursively 递归提取，比较彻底,
```
在提取出来的squashfs-root可以找到www，这个里面放的是我们网页根目录的东西。注意到里面有个cgi-bin打开一看是个lua脚本：
```lua
#!/usr/bin/lua
require "luci.cacheloader"
require "luci.sgi.cgi"
luci.dispatcher.indexcache     = "/tmp/luci-indexcache"
luci.dispatcher.dataindexcache = "/tmp/luci-dataindexcache"
luci.sgi.cgi.run()
```
这对应于我们路由器首页的的cgi-bin，但我们首页进去明显是一个登录页面，不太对。我们就可以用以下命令搜索这个登录页面存在固件的哪个文件里：
```bash
grep -rna "请输入密码" . 
```
可以看到一个资源文件：
![在这里插入图片描述](/images/e5f4385acf27f8bb27fc3c338070838e.png#pic_center)

```bash
grep -rna "zh-cn.js" . #(在macos下最好用ggrep，使用brew install grep即可)
```
我们看一下谁引用了这个资源文件：
![在这里插入图片描述](/images/c2149159e4bcf97c2e2921ce2f61c73c.png#pic_center)
那么谁引用了这个文件呢？查一下，没查到/
```bash
grep -rna "luci-mod-base.list" . 
```
扩大范围试试：
```bash
grep -rna "luci-mod-base" . 
```
![在这里插入图片描述](/images/621fcf0824d1f426dd76f40052f26f3e.png#pic_center)
去这个文件里看看，发现了登录验证内容：
![在这里插入图片描述](/images/ea78770bb8cb46022c797481200d9d42.png#pic_center)
发现这个登录引用了名为"luci.data.guide"的包，来验证当前输入的密码是否正确。既然当前的dispacher.lua脚本位置在`/usr/lib/lua/luci
`目录下,那么我们就去`/usr/lib/lua/luci/data`目录下找：
找到guide.lua发现引用了guide_plt.lua
![在这里插入图片描述](/images/577320774aeebcc6e8a590d8e657aae9.png#pic_center)
去guide_plt.lua里面看看发现引用了luci.adapter.libphi_cgi的get_conf函数来获得密码：
![在这里插入图片描述](/images/dafc3c7c5811032113232b40deb62dd5.png#pic_center)
引用了set_conf函数来修改密码：
![在这里插入图片描述](/images/8a6b8dd3a564c9df593e238f7f9d6542.png#pic_center)

于是去目录`/usr/lib/lua/luci/adapter/`下面寻找，发现了一个.so文件，去这个这个文件里面找get_conf和set_conf函数，使用ghidra，搜索字符串"get_conf"和"set_conf",
![在这里插入图片描述](/images/27efb2b46a0315f9299375be79820f00.png#pic_center)

![在这里插入图片描述](/images/a3558fe2b019e5767ac54bb0a27de07c.png#pic_center)
使用右键
![在这里插入图片描述](/images/352967fcda6605b136dd54d852e62752.png#pic_center)

![在这里插入图片描述](/images/5f3be2921df352c6b2f5f5ceb8e63f4a.png#pic_center)
继续跟，
![在这里插入图片描述](/images/f37332cd920ed9a3fb26f18945ea5324.png#pic_center)
发现了lua_register注册函数。
去（lua5.1官方手册上看了一下https://www.lua.org/manual/5.1/manual.html)
发现第三个参数是一个数组：
```lua
void luaL_register (lua_State *L,
                    const char *libname,
                    const luaL_Reg *l);
```
 luaL_Reg他的结构体是：
 ```lua
 typedef struct luaL_Reg {
  const char *name;
  lua_CFunction func;
} luaL_Reg;

 ```
 也就是一个是函数名一个是函数的地址，这个组成一个luaL_Reg结构体，多个这样的结构体组成一个数组，我们把数组开头的元素的地址作为我们的第三个参数也就是PTR_DAT_0002406c + 0x4010，其中PTR_DAT_0002406c =0x20000相加得到0x24010。
 luaL_Reg 数组必须以一对name与 func 皆为 NULL 结束。
 这与我们逆向的结果吻合。
 
 可以参考这篇博客：https://www.jianshu.com/p/6f5ab6d67ffc
 比较详细，讲怎么注册函数才能给lua作为动态链接库用。
![在这里插入图片描述](/images/e5f5b1877ab90208e7b816927c0cb6ef.png#pic_center)

 换言之里面的FUN_0012fd4就是我们get_conf的函数位置，也就是说get_conf对应结构体中的`  const char *name;
`，FUN_0012fd4对应结构体中的`  lua_CFunction func;
`我们跟进去看看：
 ![在这里插入图片描述](/images/23d465fab5e74ca13f77723237cc06e8.png#pic_center)
很明显，这个函数里面要调用PTR_00024078 + 0x2ce8这个函数，继续追踪，首先看PTR_00024078 结果发现：
![在这里插入图片描述](/images/c82cf01da2f03ff0735cb4b36cdc5554.png#pic_center)
这个指针指向的是0x000000地址，如果相加的话，也就是PTR_00024078 + 0x2ce8=0x2ce8，但显然不对，我们没有找到这个地址但函数。
![在这里插入图片描述](/images/3dcfee2a8ec72136a4afce6b5bc24543.png#pic_center)
注意到整个动态链接库的起始段地址是以0x10000开头：
那么我们不妨猜一下PTR_00024078的指针指向的就是这个0x10000地址，那么PTR_00024078 + 0x2ce8=0x12ce8，
而之前函数 luaL_register 的第二个参数指向的地方就是PTR_00024078 + 0x3e18=0x13e18，去那个地方看看：
![在这里插入图片描述](/images/5765be2b92ea5db5527e8566190d33c7.png#pic_center)
发现果然第二个参数指的是一个字符串叫做libphi-cgi，那么这个get-conf指向的就是函数0x12ce8
去这个函数看看，发现这个函数调用了cal_getvalue这个外部函数。
![在这里插入图片描述](/images/ca889626ab8124dfccd460bb9d723b82.png#pic_center)
去打开外部链接库看看，发现有个库libcal.so可疑，去看看，
![在这里插入图片描述](/images/dcac3ebce91e6ebccc25e05b2b25e996.png#pic_center)
在cal_getvalue里面发现capi_getvalue调用
![在这里插入图片描述](/images/bff739ddd3a2b1f2930dacb57678b85f.png#pic_center)

很显然capi_getvalue与libcapi.so	有关，再去看看：
![在这里插入图片描述](/images/87825d6bd9849ea53dc2f2a0d7993b88.png#pic_center)
结果发现，capi_getvalue调用了外部函数help_sendMsgToServer，显然是与help相关的库导入的，问题是目前有两个，libhelper.so和	libugwhelper.so	至于该用哪个，不太确定，我们在root目录下用命令
```bash
grep -rna "help_sendMsgToServer" . 

```
可以看到
![在这里插入图片描述](/images/f33e5c03f4d2d7c9910bd9190dbf6215.png#pic_center)
可以看到在libugwhelper.so里面，再去找找：
![在这里插入图片描述](/images/ad383c11dab56c17fc29104a1c8558bf.png#pic_center)
发现这个函数里面主要在与ubus做交互，ubus是啥，网上查了一下，发现是openwrt用于进程间通讯的程序。说明本质上这个程序获取账号密码或者修改账号密码的本质都是向ubus发送数据，再由ubus来执行。
之后去github上面查了help_sendMsgToServer这个函数，居然查到了源码（https://github.com/paldier/k3c_code/blob/master/ugw/feeds_ugw/framework/helper/libugwhelper/src/ugw_framework.c），这下就基本不用怎么逆向了。
![在这里插入图片描述](/images/71318b1f028f2d0c4a5be34eaf5047c9.png#pic_center)
![在这里插入图片描述](/images/ec41462030daa495e25ad15af8de7ccc.png#pic_center)
这里面的注释也基本符合我的猜测，这个函数就是给ubus发送信息的。其中第三第四个参数IN const char *pcServerName, 和								IN const char *pcOper引发了我的兴趣，这应该是发送给ubus表示自己要调用的服务名，servername和操作operation，也就是，puvar6和7我看了看，和前面的那个思路一样，一个是0x1207c一个是0x120a8
![在这里插入图片描述](/images/6c17bc805520751c9f4db57484e9bdb4.png#pic_center)
![在这里插入图片描述](/images/844a47629b527d60cc28e9a39c0967f7.png#pic_center)
说明服务名是csd操作名是get。
去固件里查了下这个程序发现确实存在，逆向这个试试
![在这里插入图片描述](/images/cee7c084233e254b29e5a7b4804dc2d0.png#pic_center)
打开字符串的列表，发现里面有很多文件的路径，会不会就是密码的存放路径呢？这些文件名字中大都有“run”，待会就用这个来过滤系统调用。![在这里插入图片描述](/images/11a732f7c847f25cd0c9a0d4ef3d51a3.png#pic_center)
我们登到路由器里面查看进程，发现确实有这个进程，进程id为13340:
![在这里插入图片描述](/images/1f8d36e59642f0850e8090090fc2fb48.png#pic_center)
然后编写了个改账号密码的脚本来测试下系统调用：
```lua
local plt = require("luci.data.guide_plt")
local errcode, result
errcode, result = plt.modify_account_plt("admin", "admin")
```
保存为test.lua文件然后使用命令`lua test.lua`来执行。这样是手动调用来修改密码，同时在此之前，在另一个地方打开终端使用strace来追踪系统调用:
```bash
strace -p 13340 2>&1 |grep run
```
我们注意到csd这个程序有访问/tmp目录内的文件，但我们知道/tmp目录中的文件是临时的，一般不会拿来保存密码，同时还注意到有对/opt/lantiq/config/.run-data.xml的access的请求，但却没有写入操作，这说明该程序可能唤起了一个子进程来写文件。
![在这里插入图片描述](/images/631d8a6748ac07d2657ea4239255234c.png#pic_center)

我们给strace加上-f参数来试试：
```bash
strace  -f -p 13340 2>&1 |grep run
```
![在这里插入图片描述](/images/528843348d5b53e159e9de9209416e85.png#pic_center)
结果神奇的事情发生了，我们还看到了程序使用execve唤起了openssl的加密，密码是HALLELUJAH，加密后的文件写入了/opt/lantiq/config/.run-data.xml这个与我们对csd程序中的函数进行逆向的结果吻合（可以查找字符串/opt/lantiq/config/.run-data.xml找到）：
![在这里插入图片描述](/images/b60a6e615dcf219dd5f847a4d6ae1121.png#pic_center)
既然这样的话，那么我们使用同样的命令对该文件进行解密不就行了么？于是，我使用以下命令，果然执行了成功的解密（源码文件也证实了我这点：https://github.com/paldier/k3c_code/blob/master/ugw/feeds_ugw/framework/libscapi/src/scapi_crypt.c）：
```bash
openssl aes-256-cbc -base64 -d -in /opt/lantiq/config/.run-data.xml -out result.xml -pass pass:HALLELUJAH
```
解密出来的是一个xml文件，在里面可以看到密码：
![在这里插入图片描述](/images/cb14fe4de9c567b84ba31cbee43b86d5.png#pic_center)
总结：openwrt嵌入式系统修改密码的方式是使用ubus调用csd服务，而csd服务并不会专门给修改密码定义函数，csd只接收传进来的对象然后把他们添加或者修改成为临时的xml文件再对临时的xml文件进行加密，最终存储在flash里面。
