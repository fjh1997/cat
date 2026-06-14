---
title: puppeteer安装“Chromium”已损坏，无法打开。 您应该将它移到废纸篓。
abbrlink: 9457
url: /posts/9457.html
date: 2022-03-21 10:52:16
tags:
---


```bash
brew install chromium
xattr -cr /Applications/Chromium.app
```
在~/.zshrc里写
```bash
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
export PUPPETEER_EXECUTABLE_PATH=`which chromium`
```
重启终端安装

参考：https://linguinecode.com/post/how-to-fix-m1-mac-puppeteer-chromium-arm64-bug
