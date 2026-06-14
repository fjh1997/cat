---
title: lvm分区扩容
abbrlink: 56256
url: /posts/56256.html
date: 2021-05-14 20:40:52
tags:
---

扩容前：
```bash 
NAME                      MAJ:MIN RM   SIZE RO TYPE MOUNTPOINT
loop0                       7:0    0  55.4M  1 loop /snap/core18/1944
loop1                       7:1    0  69.9M  1 loop /snap/lxd/19188
loop2                       7:2    0  31.1M  1 loop /snap/snapd/10707
sda                         8:0    0 447.1G  0 disk 
├─sda1                      8:1    0   512M  0 part /boot/efi
├─sda2                      8:2    0     1G  0 part /boot
└─sda3                      8:3    0 445.6G  0 part 
  └─ubuntu--vg-ubuntu--lv 253:0    0 245.6G  0 lvm  /
sdb                         8:16   0 223.6G  0 disk 
├─sdb1                      8:17   0 222.8G  0 part 
└─sdb2                      8:18   0   799M  0 part 
sdc                         8:32   0   1.8T  0 disk 
├─sdc1                      8:33   0   128M  0 part 
└─sdc2                      8:34   0   1.8T  0 part 
```
扩容命令：
```bash
lvextend -l 100%FREE /dev/mapper/ubuntu--vg-ubuntu--lv
```
扩容后：
```bash
NAME                      MAJ:MIN RM   SIZE RO TYPE MOUNTPOINT
loop0                       7:0    0  55.4M  1 loop /snap/core18/1944
loop1                       7:1    0  69.9M  1 loop /snap/lxd/19188
loop2                       7:2    0  31.1M  1 loop /snap/snapd/10707
sda                         8:0    0 447.1G  0 disk 
├─sda1                      8:1    0   512M  0 part /boot/efi
├─sda2                      8:2    0     1G  0 part /boot
└─sda3                      8:3    0 445.6G  0 part 
  └─ubuntu--vg-ubuntu--lv 253:0    0 445.6G  0 lvm  /
sdb                         8:16   0 223.6G  0 disk 
├─sdb1                      8:17   0 222.8G  0 part 
└─sdb2                      8:18   0   799M  0 part 
sdc                         8:32   0   1.8T  0 disk 
├─sdc1                      8:33   0   128M  0 part 
└─sdc2                      8:34   0   1.8T  0 part 
```
之后扩展文件系统就可以了：
```bash
resize2fs /dev/mapper/ubuntu--vg-ubuntu--lv
```
