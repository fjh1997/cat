---
title: chrome浏览器window.open闪退的调试方法
date: 2021-02-04 09:49:36
tags:
---

由于window.open属于弹开新的窗口，这样的话就不能看到控制台的报错以及网络日志等信息，这个时候可以加target="_self"解决。
使用"_self"的target参数即可看到报错信息，发现是同源策略问题，换https解决之。
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/c8b78195447806c9bedd7ce28c9f64cf.png#pic_center)
还有一个办法，就是在设置里勾选：
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/9a4a3e5d56e6363ea9da9899f73a8b77.png#pic_center)
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/38202677beb3867bb0ac58003abd9820.png#pic_center)
然后添加""alwaysLowered""参数，如：
```javascript
window.open("http://file.hackingfor.fun/camp/3/liuliang.zip","_blank","alwaysRaised")
```
就能够保持控制台不退出。

官方推荐的方法则是在日志里查看，需要退出所有chrome进程，然后只开启一个使用` chrome.exe --enable-logging --v=1 ` 参数启动的进程（不然会出现日志不记录的错误），就能够在`C:\Users\你的用户名\AppData\Local\Google\Chrome\User Data\chrome_debug.log`里看到日志：
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/e3faffd624478872c2e0c679e3539b13.png#pic_center)


参考：

 - https://stackoverflow.com/questions/16210468/chrome-dev-tools-how-to-trace-network-for-a-link-that-opens-a-new-tab
 - https://stackoverflow.com/questions/7627113/save-the-console-log-in-chrome-to-a-file
   
- https://stackoverflow.com/questions/53713705/chrome-enable-logging-flag-not-taking-effect

