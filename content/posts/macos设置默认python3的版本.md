---
title: macos设置默认python3的版本
abbrlink: 12191
url: /posts/12191.html
date: 2021-07-08 12:06:39
tags:
---

通过以下命令对python安装器进行解包：

```bash
kgutil --expand python-3.10.0b1-macos11.pkg py10pkg
```
可以看到出现很多解出来的pkg文件，需要注意的是这些文件和kext一样其实是目录，右键显示包内容可以看到。
![在这里插入图片描述](/images/5439b02db4ae0a95de719626f20800dc.png)
里面的postinstall文件打开是这个样子：
![在这里插入图片描述](/images/29d6c81d931531f278a62a90d4eab4ce.png#pic_center)
通过对代码进行分析，由于macos的默认shell是zsh，所以环境变量在～/.zprofile里面。
去查看上述文件，破案了：
![在这里插入图片描述](/images/8681939ab4c06171c0a6802be3aefcea.png#pic_center)
也就是说把以下脚本改成对应的版本执行就行了：
我这里是python3.9

```bash
#!/bin/sh

echo "This script will update your shell profile when the 'bin' directory"
echo "of python is not early enough of the PATH of your shell."
echo "These changes will be effective only in shell windows that you open"
echo "after running this script."

PYVER=3.9
PYTHON_ROOT="/Library/Frameworks/Python.framework/Versions/3.9"

if [ `id -ur` = 0 ]; then
	# Run from the installer, do some trickery to fetch the information
	# we need.
	theShell="`finger $USER | grep Shell: | head  -1 | awk '{ print $NF }'`"

else
	theShell="${SHELL}"
fi

# Make sure the directory ${PYTHON_ROOT}/bin is on the users PATH.
BSH="`basename "${theShell}"`"
case "${BSH}" in
bash|ksh|sh|*csh|zsh|fish)
	if [ `id -ur` = 0 ]; then
		P=`su - ${USER} -c 'echo A-X-4-X@@$PATH@@X-4-X-A' | grep 'A-X-4-X@@.*@@X-4-X-A' | sed -e 's/^A-X-4-X@@//g' -e 's/@@X-4-X-A$//g'`
	else
		P="`(exec -l ${theShell} -c 'echo $PATH')`"
	fi
	;;
*)
	echo "Sorry, I don't know how to patch $BSH shells"
	exit 0
	;;
esac

# Now ensure that our bin directory is on $P and before /usr/bin at that
for elem in `echo $P | tr ':' ' '`
do
	if [ "${elem}" = "${PYTHON_ROOT}/bin" ]; then
		echo "All right, you're a python lover already"
		exit 0
	elif [ "${elem}" = "/usr/bin" ]; then
		break
	fi
done

echo "${PYTHON_ROOT}/bin is not on your PATH or at least not early enough"
case "${BSH}" in
*csh)
	if [ -f "${HOME}/.tcshrc" ]; then
		RC="${HOME}/.tcshrc"
	else
		RC="${HOME}/.cshrc"
	fi
	# Create backup copy before patching
	if [ -f "${RC}" ]; then
		cp -fp "${RC}" "${RC}.pysave"
	fi
	echo "" >> "${RC}"
	echo "# Setting PATH for Python ${PYVER}" >> "${RC}"
	echo "# The original version is saved in .cshrc.pysave" >> "${RC}"
	echo "set path=(${PYTHON_ROOT}/bin "'$path'")" >> "${RC}"
	if [ `id -ur` = 0 ]; then
		chown "${USER}" "${RC}"
	fi
	exit 0
	;;
bash)
	if [ -e "${HOME}/.bash_profile" ]; then
		PR="${HOME}/.bash_profile"
	elif [ -e "${HOME}/.bash_login" ]; then
		PR="${HOME}/.bash_login"
	elif [ -e "${HOME}/.profile" ]; then
		PR="${HOME}/.profile"
	else
		PR="${HOME}/.bash_profile"
	fi
	;;
fish)
	CONFIG_DIR="${HOME}/.config/fish"
	RC="${CONFIG_DIR}/config.fish"
	mkdir -p "$CONFIG_DIR"
	if [ -f "${RC}" ]; then
		cp -fp "${RC}" "${RC}.pysave"
	fi
	echo "" >> "${RC}"
	echo "# Setting PATH for Python ${PYVER}" >> "${RC}"
	echo "# The original version is saved in ${RC}.pysave" >> "${RC}"
	echo "set -x PATH \"${PYTHON_ROOT}/bin\" \"\$PATH\"" >> "${RC}"
	if [ `id -ur` = 0 ]; then
		chown "${USER}" "${RC}"
	fi
	exit 0
	;;
zsh)
        PR="${HOME}/.zprofile"
        ;;
*sh)
	PR="${HOME}/.profile"
	;;
esac

# Create backup copy before patching
if [ -f "${PR}" ]; then
	cp -fp "${PR}" "${PR}.pysave"
fi
echo "" >> "${PR}"
echo "# Setting PATH for Python ${PYVER}" >> "${PR}"
echo "# The original version is saved in `basename ${PR}`.pysave" >> "${PR}"
echo 'PATH="'"${PYTHON_ROOT}/bin"':${PATH}"' >> "${PR}"
echo 'export PATH' >> "${PR}"
if [ `id -ur` = 0 ]; then
	chown "${USER}" "${PR}"
fi
exit 0

```

