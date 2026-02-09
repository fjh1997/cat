---
title: 树莓派vi不能右键复制（右键显示可视）的问题
abbrlink: 60362
date: 2019-05-22 11:02:42
tags:
---



vim /usr/share/vim/vim80/defaults.vim
定位70行
set mouse=v
或者在vim的命令模式下输入：set paste即可
