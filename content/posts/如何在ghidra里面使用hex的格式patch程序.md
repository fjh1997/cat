---
title: 如何在ghidra里面使用hex的格式patch程序
abbrlink: 11104
url: /posts/11104.html
date: 2021-02-26 17:59:32
tags:
---

如果是使用右键->Patch instruction的话可以用汇编语言来patch程序，但如果想直接修改hex，就需要打开bytes窗口并在bytes窗口里面点击上面的图标启用编辑模式。
![在这里插入图片描述](/images/1c8333cdc3ec592b1a6602d1da2ef60e.png#pic_center)

![在这里插入图片描述](/images/8a5e3c7a700a13e5ddc0bbd74b10e33a.png#pic_center)
编辑hex的时候可能会报错：

```bash
Editing not allowed： Instruction exists at address xxxxxx
```
这个时候就需要右键-clear code bytes
![在这里插入图片描述](/images/505ce44d100520bf06adafcb3862b773.png#pic_center)
清楚code格式之后会变成问好的形状，这个时候就可以在bytes窗口里修改：

![在这里插入图片描述](/images/9133e2ea5b1bb99c1dc6b97cd0ec0d54.png#pic_center)
![在这里插入图片描述](/images/c388aba07c1d153d7b9db9e7ac653d2d.png#pic_center)
修改完之后再次disasamble就可以了。

