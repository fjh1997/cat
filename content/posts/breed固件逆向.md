---
title: breed固件逆向
abbrlink: 20215
url: /posts/20215.html
date: 2021-10-18 21:57:58
tags:
---

前情概要：https://www.right.com.cn/forum/thread-6189907-1-1.html
之前通过010editor对比了两个gpio不同的固件，结果居然成功修改了gpio键。结果楼下马上就来了个神人把修复好符号的ida伪代码给我了。
![在这里插入图片描述](/images/3fe6efff39fe882bc082d2c56711a3a9.png#pic_center)

网上一查，这个神人居然是breed开源仿制版本rtboot的作者（https://github.com/zhaohengbo/rt-boot），牛逼。
我寻思着如果我有这样的水平。那么除了reset键能改，别的led什么的gpio也能改。于是私信以及qq了那个大佬，结果大佬就是不回。无奈之下，只能自己去逆向gpio，于是网上查了一下QCA9533是大端序的mips指令。
ida打开2998这个固件之后设置好固件类型为MIPS big endian。
![在这里插入图片描述](/images/6f4d1a5a825e9f53565b7a017da3bcbe.png#pic_center)


但奈何ida一点也不识别，就一脸懵逼，左边函数都是空的。
![在这里插入图片描述](/images/1135e9a26a8fc0b2ec06b8e6db2d1993.png#pic_center)


找到我24 04 00 0E 24 05 00 01的数据(原版固件应该是24 04 00 0B 24 05 00 01)按了下C，发现这里是mips指令，好像a0,a1,a2传了参数，分别是0xe,1,0x2c(gp)-0x2664（详见mips函数调用约定https://blog.csdn.net/Lrrent/article/details/51172766）
![在这里插入图片描述](/images/fa9401b076670972a3618ec0cb432af6.png#pic_center)

这个和那个神人反编译出来的函数gpio_button_register的参数很像，应该有希望。

网上查了下ida需要有基地址才能识别字符串，所谓基地址，就是把固件加载到内存里的地址，也就是这个固件的地址0对应的内存里的地址，于是查到了这个工具拿来爆破基地址（https://github.com/sgayou/rbasefind）

爆破时间不长，用了做实验的12核服务器爆破大概一会就出来了。
结果如下：

```bash
0x80100000: 220
0x24810000: 167
0x24820000: 112
0x80106000: 85
0x24a30000: 72
0x80107000: 55
0x8f962000: 45
0x8f961000: 42
0x8f95e000: 42
0x80104000: 37
```

说明基地址大概率是0x80100000
ida里面edit-segments-rebase program填入基地址发现还是无法自动识别出字符串，但rbasefind的原理就是识别比如0x8012CC45这样代表地址的二进制数据，如果这个数据恰好指向一个字符串，那么这个大概率就是内存里面真实地址，再根据这个地址计算出基地址。

又找了找，这篇文章（https://bbs.pediy.com/thread-266803.html）说ghidra得到基地址后识别函数的效率高，试了一下果然如此，而且一些字符串可以识别了:
![在这里插入图片描述](/images/9fefe3112071c39f6f4051a57c87ac92.png#pic_center)

![在这里插入图片描述](/images/c13ccbfbf02628666d7fecc894024c73.png#pic_center)



使用和那个文章一样的办法讲函数列表导入ida，使得ida也能识别函数，之后我又去之前那个24 04 00 0E 24 05 00 01的地方看了一下，发现已经能够反编译了，但是不够完美，因为没有符号表。接下来只要恢复符号表即可，但这又恰恰是最难的一步。
![在这里插入图片描述](/images/5eacd37e9c4d78366b9962a272e2c207.png#pic_center)


联想到elf结构里面符号表symtab和字符串表strtab的关系，strtab往往在elf的末尾段，symtab在中间，而且里面是一个表格，里面是一个结构体记录了函数地址和符号在strtab里面的偏移。


于是尝试去找了找有没有符号表这个东西。往里面找了找前两个函数0x80110424和0x8011090c由于qca9533是大端序，所以直接搜索80110424和8011090c即可。
还真每个地址分别搜到了两处出现的，但其中一处是连续的80开头的地址，所以排除，于是找到了一个类似符号表的地方，之所以说类似是因为这个符号表的结构和elf32不太一样。
![在这里插入图片描述](/images/52813d6b3ff6aeff73001ab9c0b5b428.png#pic_center)
![在这里插入图片描述](/images/978296682f128051f44aa5be0f337398.png#pic_center)
注意里面0x3744和0x40f1这两个数分别对应函数0x80110424和0x8011090c，他们相差2477，而那个大神截图中的gpio_button_register和gpio_led_register在下图的strtab里面相差的偏移0x46158-0x46b05也是2477，
![在这里插入图片描述](/images/61e008cff435e054de602c312cc0b45c.png#pic_center)


那么我们就可以得出这样的结论：
![在这里插入图片描述](/images/57eb8d52725a7a427f0bc0f367e3c4f2.png#pic_center)


按照这个思路写idapython脚本重命名函数就可以了：

```python
start_address=0x80144B2C
while True:
    a=get_bytes(start_address,1)
    if a== b'\x80':
        print("good")
        create_dword(start_address)
        create_word(start_address-2)
    else:
        print("bad")
        print(hex(start_address))
        break
        
    start_address=start_address-0x10

string_address=0x46158+0x80100000-0x3744
#0x80142a14
table_start=0x80142A5C
table_end=0x80144B2C
while True:
    func_addr=int.from_bytes(get_bytes(table_start,4),"big")
    idx=int.from_bytes(get_bytes(table_start+14,2),"big")+string_address
    func_name=get_strlit_contents(idx)
    print(get_name(func_addr)+" "+func_name.decode())
    set_name(func_addr,func_name.decode())
    if table_start ==table_end:
        break
    table_start=table_start+0x10
```

之后就得到了 恢复符号表的结果，可以看出几乎所有的函数名都恢复了，接下来逆向分析就很方便了。
![在这里插入图片描述](/images/0f2da4b52d6263b597b454594b96e216.png#pic_center)



下面附上我的idb文件供大家参考：
链接: https://pan.baidu.com/s/14-fcuymIozXeJJzCjvm6SA 提取码: r6d9


参考文章：

 1. [分享]一次嵌入式固件逆向实践 看雪论坛 https://bbs.pediy.com/thread-266803.html
   
 2. IoT漏洞研究（一）固件基础 freebuf
        https://www.freebuf.com/articles/endpoint/254257.html
3.  https://paper.seebug.org/613/
