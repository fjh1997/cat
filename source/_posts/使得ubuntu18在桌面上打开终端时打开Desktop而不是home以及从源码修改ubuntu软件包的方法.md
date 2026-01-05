---
title: 使得ubuntu18在桌面上打开终端时打开Desktop而不是home以及从源码修改ubuntu软件包的方法
date: 2020-04-19 17:01:23
tags:
---

# 方法一
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/89e353384b8e0a8451c80451ca925205.png)
如图在桌面上右键Open Terminal的时候我们想要打开的是桌面，而事实上ubuntu打开的是home目录，这个主要的原因是这个插件/usr/lib/x86_64-linux-gnu/nautilus/extensions-3.0/libterminal-nautilus.so没有写好，要解决这个问题，从根本上可以通过修改源码[gnome-terminal](https://packages.ubuntu.com/source/bionic/gnome-terminal)重新编译来解决详见方法二。但是有点麻烦，这里介绍一个不完美但是比较简便的方法，就是在~/.bashrc里面加一行

```bash
cd Desktop
```
这样也会产生一些新的问题，比如在home目录下打开终端会跳转到Desktop，但假如你的个人喜好和我一样是在桌面上操作的话，这个就问题不大。

# 方法二 
方法二需要我们下载源码，首先进入[官方源码发布页](https://packages.ubuntu.com/source/bionic/gnome-terminal)
我们可以看到三个文件。
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/29058ee8d8946b0cce7266f683eac639.png)
这三个文件就是我们根据源码编译最终得到的结果，我们需要的文件是nautilus-extension-gnome-terminal，也就是这个[deb安装包](http://cz.archive.ubuntu.com/ubuntu/pool/main/g/gnome-terminal/nautilus-extension-gnome-terminal_3.28.1-1ubuntu1_amd64.deb)
通过解压deb包我们可以发现，在\usr\lib\x86_64-linux-gnu\nautilus\extensions-3.0\目录下有一个 libterminal-nautilus.so文件，这个文件决定了 我们在桌面上打开终端后进入的是home目录还是desktop目录。

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/445348de96de64a8424b951798a1bc45.png)
## 下载源码
往下翻，可以看到里面有三个源码文件，第一个是源码文件的密钥文件，我们暂时不需要，第二个文件是源码文件的gnome-terminal原始源码，第三个是针对ubuntu系统的补丁，在gnome-terminal官方源码的基础上应用这个补丁，就能在ubuntu上面运行，不然会出bug。因此我们需要下载的是第二、第三个文件。
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/3da9de1d5763a733f39d5eaada0053e0.png)
下载好gnome-terminal_3.28.1.orig.tar.xz文件之后解压出一个文件夹gnome-terminal-3.28.1，将gnome-terminal_3.28.1-1ubuntu1.debian.tar.xz	里面debian目录下的文件覆盖到之前解压出的gnome-terminal-3.28.1目录下，我们就得到一个包含src、patches的文件夹。
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/75f4da8a0cec0f335a970760fc9ccdb7.png)
## 应用补丁
使用以下命令应用补丁：

```bash
git apply patches/*.patch
```

## 修改源码
在src目录中，我们可以找到以下代码片段

```c
 case FILE_INFO_DESKTOP://这个说明是在桌面上打开
      if (desktop_is_home_dir (nautilus) || desktop_opens_home_dir (nautilus)) {
      //这个if判断条件很重要
        path = g_strdup (g_get_home_dir ());
      } else {
        path = g_strdup (g_get_user_special_dir (G_USER_DIRECTORY_DESKTOP));
      }
      break;

```
这个就是关键代码，其中if判断条件判断desktop_is_home_dir (nautilus)和desktop_opens_home_dir (nautilus)这两个函数是否成立，只要有其中一个成立，我们就打开home目录，不然我们就打开桌面,之后，我们继续搜索desktop_is_home_dir (nautilus)和desktop_opens_home_dir (nautilus)这两个函数，
首先找到desktop_is_home_dir (nautilus)这个函数，

```bash
static inline gboolean
desktop_is_home_dir (TerminalNautilus *nautilus)
{
  return FALSE;
}
```
由于ubuntu默认桌面不是home目录，所以这个函数返回FALSE。
之后我们继续寻找desktop_opens_home_dir (nautilus)这个函数
```c
static inline gboolean
desktop_opens_home_dir (TerminalNautilus *nautilus)
{
#if 0
  return  _client_get_bool (gconf_client,
                                "/apps/nautilus-open-terminal/desktop_opens_home_dir",
                                NULL);
#endif
  return TRUE;//这里要改为FALSE
}
```
注意这里返回了TRUE说明在desktop上面打开终端后进入的是home目录，我们需要改为FALSE，这样才能进入Desktop目录。
修改后我们得到以下代码：
```c
static inline gboolean
desktop_opens_home_dir (TerminalNautilus *nautilus)
{
#if 0
  return  _client_get_bool (gconf_client,
                                "/apps/nautilus-open-terminal/desktop_opens_home_dir",
                                NULL);
#endif
  return FALSE;
}
```
这样代码就修改完了，顺便我们还可以看看代码别的部分，如下两段代码分别设置了桌面上右键和普通文件夹里面右键显示的不同，其中桌面上是Open Terminal而普通文件夹里面是Open in Terminal，只相差了一个in。
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/c00a3e6583d0f14e1c45f4ffe996686c.png)
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/aa5557868aae6d946366fa21e9c7d291.png)

```c
 case FILE_INFO_DESKTOP:
        if (desktop_opens_home_dir (nautilus)) {
          name = _("Open T_erminal");
          tooltip = _("Open a terminal");
        } else {
          name = _("Open in T_erminal");
          tooltip = _("Open the currently open folder in a terminal");
        }
        break;
```
```c
   case FILE_INFO_OTHER:
        name = _("Open in T_erminal");

        if (is_file_item) {
          tooltip = _("Open the currently selected folder in a terminal");
        } else {
          tooltip = _("Open the currently open folder in a terminal");
        }
        break;
```
## 安装依赖

```bash
sudo apt install  intltool  libvte-2.91-dev gsettings-desktop-schemas-dev uuid-dev libdconf-dev libpcre2-dev libgconf2-dev libxml2-utils  gnome-shell libnautilus-extension-dev itstool  yelp-tools pcre2-utils
```
## 编译安装
我们按照autoreconf->autoconf->configure->make->make install的步骤进行
```bash
autoreconf --install
autoconf
./configure --prefix='/usr'
make
sudo make install
```
编译好之后我们重启，之后在桌面上打开终端，看看是否生效。很遗憾我的没生效，经过仔细检查，发现原因是make install 把libterminal-nautilus.so安装到了/usr/lib/nautilus/extensions-3.0/目录下，而我们需要安装到\usr\lib\x86_64-linux-gnu\nautilus\extensions-3.0\目录下，因此需要以下命令来复制这个库文件。

```bash
cp /usr/lib/nautilus/extensions-3.0/libterminal-nautilus.so \usr\lib\x86_64-linux-gnu\nautilus\extensions-3.0\
```
复制之后，桌面上右键菜单会暂时不可用，但重启之后就会恢复正常了。
现在我们在桌面上打开终端，默认进入的就是desktop目录：
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/2fee2a2b572756f23087260feb91f6e9.png)
