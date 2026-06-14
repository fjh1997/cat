---
title: RT-AX56U_V2 已满的情况删除jffs分区文件
abbrlink: 21633
url: /posts/21633.html
date: 2023-04-22 14:13:11
tags:
---



```
admin@RT-AX56U_V2-4F08:/jffs# df -h
Filesystem                Size      Used Available Use% Mounted on
/dev/root                25.6M     25.6M         0 100% /
devtmpfs                122.3M         0    122.3M   0% /dev
tmpfs                   122.4M    380.0K    122.1M   0% /var
tmpfs                   122.4M      7.0M    115.5M   6% /tmp/mnt
ubi1:data                 1.0M     64.0K    880.0K   7% /data
tmpfs                   122.4M      7.0M    115.5M   6% /tmp/mnt
tmpfs                   122.4M      7.0M    115.5M   6% /tmp
/dev/mtdblock9           15.0M     15.0M         0 100% /jffs
```


设备满了排查发现./.sys/diag_db 占用那么大


```
admin@RT-AX56U_V2-4F08:/jffs/.sys/diag_db# rm -rf conn_diag_1680566400.db-journal
rm: can't remove 'conn_diag_1680566400.db-journal': No space left on device
```


删都删不掉

```
admin@RT-AX56U_V2-4F08:/jffs/.sys/diag_db# ls
conn_diag_1680566400.db-journal  conn_diag_1681689600.db          conn_diag_1681776000.db
```


好像是梅林自带的服务 
似乎jffs分区删除文件也会增加占用的空间


只能dd出来删了然后dd回去

参考
https://www.snbforums.com/threads/fix-full-jffs-without-factory-reset.66035/
https://wiki.emacinc.com/wiki/Mounting_JFFS2_Images_on_a_Linux_PC

dd /dev/mtdblock9 到tmp里然后电脑上开ftp服务，用路由器自带的ftpget和ftpput传文件，在电脑上删除里面的文件

```
apt install mtd-utils
# cleanup if necessary
umount /dev/mtdblock0
modprobe -r mtdram
modprobe -r mtdblock

modprobe mtdram total_size=50000 erase_size=128
modprobe mtdblock
dd if=original.jffs2 of=/dev/mtdblock0
mkdir jffs_mount
mount -t jffs2 /dev/mtdblock0 jffs_mount
```

删除文件后

```
mkfs.jffs2 -r jffs_mount --eraseblock=0x20000 --pad=0x2f00000 -o trimmed.jffs2
```


参数去/proc/mtd里面找

```
cat /proc/mtd
dev:    size   erasesize  name
mtd0: 05f00000 00020000 "rootfs"
mtd1: 05f00000 00020000 "rootfs_update"
mtd2: 00800000 00020000 "data"
mtd3: 00100000 00020000 "nvram"
mtd4: 05f00000 00020000 "image"
mtd5: 05f00000 00020000 "image_update"
mtd6: 10000000 00020000 "dummy1"
mtd7: 10000000 00020000 "dummy2"
mtd8: 00100000 00020000 "misc3"
mtd9: 02f00000 00020000 "misc2"
mtd10: 00800000 00020000 "misc1"
mtd11: 05638000 0001f000 "rootfs_ubifs"
mtd12: 0001f000 0001f000 "METADATA"
mtd13: 0001f000 0001f000 "METADATACOPY"
mtd14: 003421d0 0001f000 "filestruct_full.bin"
mtd15: 006c8000 0001f000 "data"
```

然后ftp回路由器，dd回/dev/mtdblock9

```
Filesystem                Size      Used Available Use% Mounted on
/dev/root                25.6M     25.6M         0 100% /
devtmpfs                122.3M         0    122.3M   0% /dev
tmpfs                   122.4M    204.0K    122.2M   0% /var
tmpfs                   122.4M      4.5M    117.9M   4% /tmp/mnt
ubi1:data                 1.0M     64.0K    880.0K   7% /data
tmpfs                   122.4M      4.5M    117.9M   4% /tmp/mnt
tmpfs                   122.4M      4.5M    117.9M   4% /tmp
/dev/mtdblock9           15.0M     10.1M      4.9M  67% /jffs
```

现在恢复正常了，但没有从根本上解决问题，那个conn_diag怎么关闭还是个问题


```
admin@RT-AX56U_V2-4F08:/jffs/.sys/diag_db# ps w|grep diag
 2450 admin    13324 S    conn_diag
 8326 admin     3212 S    grep diag
```

```
lrwxrwxrwx    1 admin    root             2 Jun 21  2021 conn_diag -> rc
```


conn_diag是软链接，rc程序没法删，源码也找不到，conn_diag.o貌似不开源，直接链接到rc里的。


找了一圈网上编译固件的教程都是把conn_diag.c注释掉的

```
admin@RT-AX56U_V2-4F08:/jffs/.sys# rm -r diag_db/
admin@RT-AX56U_V2-4F08:/jffs/.sys# ln -s /tmp/diag_db diag_db
```

建了个软链接把日志放tmp里面


算是解决了


