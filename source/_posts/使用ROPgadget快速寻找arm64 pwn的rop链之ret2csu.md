---
title: 使用ROPgadget快速寻找arm64 pwn的rop链之ret2csu
date: 2021-01-28 18:26:54
tags:
---

```bash
 ROPgadget --binary ./pwn --only "ldp|ret"
```
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/7ad3b6efd6859c54447a61be278ded7c.png#pic_center)
看到最长的那个就是，我们得到rop链的入口0x400ff8接下来使用x30寄存器跳转的地址就是0x400ff8-0x20也就是0x400fd8这块.rop链第一阶段的目的是将0x400fd8填充到x30寄存器中。
也可以用rop
```bash
ROPgadget --binary ./chall --only "ldr|mov|add|blr"
```
找到rop链链接的第二个片段入口
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/828e3dd05ca0914e73490f155b42bbcc.png#pic_center)
最后我们可以在x3中填充我们想要的地址，比如libc中的system地址。
