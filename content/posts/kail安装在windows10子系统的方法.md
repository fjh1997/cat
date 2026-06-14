---
title: kail安装在windows10子系统的方法
abbrlink: 40112
url: /posts/40112.html
date: 2018-06-01 15:38:57
tags:
---

WSL1版本：

最近win10更新了linux子系统，我们可以不用虚拟机安装kail。

1.打开powershell（新版本win10自带）键入

```bash

Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Windows-Subsystem-Linux
```

2.打开cmd键入

```bash

lxrun /install
```

然后耐心等待

3.安装git：https://git-scm.com/downloads

4.python3：注意要是3，https://www.python.org/ 然后设置好环境变量以便能使用python命令

5.输入以下命令，第三句之后会有点慢，请耐心等待。

```bash

git clone https://github.com/RoliSoft/WSL-Distribution-Switcher.git
cd WSL-Distribution-Switcher
python get-prebuilt.py kalilinux/kali-linux-docker
python install.py rootfs_kalilinux_kali-linux-docker_latest.tar.gz
lxrun /setdefaultuser root
```

6.在cmd中输入bash命令，启动kail

```bash

bash
```

7.设置并更新：

```bash

export LANG=C
apt-get update
apt-get dist-upgrade
```

WSL2：版本

```bash

Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Windows-Subsystem-Linux
```

然后在microsoft store里面下载kali。

并更新源

```bash

apt-get update
apt-get dist-upgrade
```

安装RDP

```bash

sudo apt -y install kali-desktop-xfce
sudo apt-get install xrdp
sudo sed -i 's/3389/3390/g' /etc/xrdp/xrdp.ini
sudo service xrdp start
sudo service xrdp-sesman start
sudo update-rc.d xrdp enable
```

然后使用远程桌面连接3390即可

![](/images/a9e10b66192c8f660672cfaa6c0afed8.png)

也可以使用VcXsrv来连接桌面，方法是启动xlaunch

![](/images/ad769613f971c29e5c881b039a03f788.png)

然后在命令行里输入

```bash

export DISPLAY=:0.0
xfce4-session
```

来源：

https://www.kali.org/tutorials/kali-on-the-windows-subsystem-for-linux/

https://www.kali.org/news/kali-linux-in-the-windows-app-store/

[https://www.kali.org/news/kali-linux-in-the-windows-app-store/](https://www.kali.org/news/kali-linux-in-the-windows-app-store/)
