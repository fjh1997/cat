---
title: No module named sqlitecachec
abbrlink: 37850
date: 2020-08-14 15:05:45
tags:
---


今天又遇到这个问题了，网上说这个sqlitecachec包在:yum-metadata-parser里，但是装了无数次还是没这个包，最后用```rpm -ivh http://mirror.centos.org/centos/7/os/x86_64/Packages/yum-metadata-parser-1.1.4-10.el7.x86_64.rpm --force```解决,简而言之就是之前装的第一次没装上 ，然后却提示已经安装上了，最好只能使用--force强制安装安装上。
