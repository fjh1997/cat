---
title: 不用虚拟机，使用windows调试linux内核
abbrlink: 51701
url: /posts/51701.html
date: 2024-08-03 18:03:09
tags:
---

1.安装msys2
https://www.msys2.org/
2.打开msys2 ucrt64安装qemu和gdb还有gef
pacman -S mingw-w64-ucrt-x86_64-qemu
pacman -S gdb
pacman -S binutils
 用下面的脚本安装gef
```bash
#!/usr/bin/env bash

set -e

# check dependencies
if [ ! "$(command -v python3)" ]; then
	echo "GEF requires Python3 installed."
	exit 1
fi

# Backup gdbinit if any
if [ -f "${HOME}/.gdbinit" ]; then
    mv "${HOME}/.gdbinit" "${HOME}/.gdbinit.old"
fi

tag=$(python3  -X utf8 -c 'import urllib.request as r,json as j; x=j.loads(r.urlopen("https://api.github.com/repos/hugsy/gef/tags").read()); print(x[0]["name"])')
python3 -X utf8 -c "import urllib.request as r; x=r.urlopen('https://github.com/hugsy/gef/raw/${tag}/gef.py').read(); print(x.decode('utf-8'))" > ${HOME}/.gef-${tag}.py

if [ -f "${HOME}/.gef-${tag}.py" ]; then
    echo "source ~/.gef-${tag}.py" > ~/.gdbinit
    exit 0
else
    echo "GEF was not properly downloaded"
    exit 2
fi

```
官方版本里面缺少`-X utf8`会出错。
3.去github下载一键包，如：
https://github.com/bsauce/kernel-exploit-factory/tree/main/CVE-2017-11176
注意start.sh里面的-enable-kvm要去掉，因为windows不支持。
4.在msys2 ucrt64里面运行start.sh
5.打开另一个窗口，运行gdb_kernel.sh
![在这里插入图片描述](/images/7d46daa21eb5467c8b9fb26026f9e4a0.png)

