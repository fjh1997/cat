---
title: 关于ghidra 9.2版本以上无法反编译pac代码pacia等函数的解决方法
abbrlink: 27469
date: 2021-01-21 11:34:14
tags:
---

arm v8.3版本以上加入了point auth code这种指令比如pacia retaa，很可惜，大多数反编译器无法编译，甚至你在跑qemu的时候如果qemu的版本太低也会报错。

之前使用ghidra 9.1.2的时候能够编译成功，但是9.2以上的时候就不行了。
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/d1a9285847ad2fe206172e50038cb47d.png#pic_center)
事实上我们在ghidra_9.2.1_PUBLIC/Ghidra/Processors/AARCH64/data/languages/AARCH64.pspec里面可以找到这一段代码和注释：

```xml
<context_data>
    <context_set space="ram">
<!-- These context registers are only modified by the user, e.g. with the "Set Registers..." command. -->
      <set name="ShowPAC" val="0" description="1 to show PAC operations in decompiler"/>
      <set name="PAC_clobber" val="0" description="1 to let PAC operations overwrite their operands in decompiler"/>
      <set name="ShowBTI" val="0" description="1 to show BTI effects in decompiler"/>
      <set name="ShowMemTag" val="0" description="1 to show memory tag checks in decompiler"/>
    </context_set>
  </context_data>
```
把里面的ShowPAC和PAC_clobber改成1重启就可以了，注释里还提到可以使用右键的set register value来设置context register也就是伪寄存器来临时修改这个flag，但是我总是报错，不知道为什么。
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/484858824724769fe815a8e5ef2f80c0.png#pic_center)
总之无论什么方法，修改了这个反编译的flag之后就能够成功实现对pacia指令对反编译。
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/de7747a981c3794ffe1445c567d1af88.png#pic_center)

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/3b2ea89c846fff36af63cf5d46e8be2f.png#pic_center)

参考：https://github.com/NationalSecurityAgency/ghidra/issues/2488


