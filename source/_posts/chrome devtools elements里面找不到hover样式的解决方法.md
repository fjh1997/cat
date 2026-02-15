---
title: chrome devtools elements里面找不到hover样式的解决方法
abbrlink: 55287
date: 2021-05-25 15:52:20
tags:
---

小白初学前端，不知道某个网站**鼠标移到图标上面的时候显示，移开就不显示**在css里面是怎么实现的。心里猜测了一下是hover属性。但是打开开发人员工具发现没有：
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/9f6697e6d57edafa49cd70aab1a0798b.png#pic_center)
找到了这个帖子，
https://stackoverflow.com/questions/4515124/see-hover-state-in-chrome-developer-tools

发现勾选hover就可以显示了：

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/c8caebe23fb154a0d258bfb6cd299fcd.png#pic_center)
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/81efb8fa5f5b563a600a0cfb8592ddc7.png)
需要注意的是由于这里的css类选择器是
```css
.user-panel .avatar:hover .editor-avatar {
    opacity: 1;
    visibility: visible;
}
```
所以要选择avatar的子元素.editor-avatar才能在开发人员工具的elements Tab里面找到hover样式的定义。
