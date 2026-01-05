---
title: 如何无损减小aws ec2 实例的根分区卷大小以及实例无法启动的排错方法
date: 2021-04-22 23:00:59
tags:
---

## 背景
aws是世界第一大云服务商，但是在调整EBS卷尤其是根分区的EBS卷的时候往往比较麻烦。如果是扩大EBS卷之后调整根分区大小还比较容易（`https://docs.aws.amazon.com/zh_cn/AWSEC2/latest/UserGuide/recognize-expanded-volume-linux.html`），但是缩小就比较难。会提示

> The size of a volume can only be increased, not decreased

因为aws想让你花钱扩大卷，所以关于扩大根分区卷这块就有官方教程，关于缩小根分区卷就没那么容易。哪个云服务商会希望你省钱呢？（滑稽，毕竟一个月一个G大概一元左右，比较贵。
我今天摸索了好久了，总算想出一个比较方便的办法：
## 步骤
### 1. 新建ebs卷并连接实例
新建一个新的EBS卷，比如你原先那个是20个G，你现在想要缩小到8G，那么就新建一个8G的ebs卷。连接到你需要缩小根分区的实例。
### 2. 对新建的ebs卷进行分区、格式化、同步文件。
#### （1.查看分区情况
我们先使用命令`sudo parted -l`来查看之前的分区信息：

```bash
[root@ip-172-31-16-92 conf.d]# sudo parted -l
Model: NVMe Device (nvme)
Disk /dev/nvme0n1: 20G
Sector size (logical/physical): 512B/512B
Partition Table: gpt
Disk Flags: 

Number  Start   End     Size    File system  Name  Flags
 1      1049kB  2097kB  1049kB               bbp   bios_grub
 2      2097kB  20480MB  24G  xfs          root

```
可以看到，这个20G的根设备卷分成了两个区，一个叫bbp，一个叫root，bbp这个区没有文件系统，但是有个flag叫做bios_grub。根设备卷是使用gpt分区的，从可以
这说明这个系统是通过grub来启动的，至于到底什么是bios_grub其实就是BIOS boot partition，参考资料如下：

> https://en.wikipedia.org/wiki/BIOS_boot_partition
> https://www.cnblogs.com/f-ck-need-u/p/7084627.html

这个大概1MB左右，还有一个叫做root的分区则是我们要重点关照的，这个分区里面存储了我们当前系统的所有文件。
那么我们备份的思路就是将这个分区的文件转移到另一个新ebs卷上面的分区上。

#### （2 使用parted对新ebs卷进行分区格式化。
使用lsblk可以看到

```bash
NAME        MAJ:MIN RM SIZE RO TYPE MOUNTPOINT
nvme0n1     259:0    0   20G  0 disk 
├─nvme0n1p1 259:1    0   1M  0 part 
└─nvme0n1p2 259:2    0   20G  0 part /
nvme1n1     270:0    0   8G  0 disk 
```
新的ebs卷为设备nvme1n1,我们需要对它进行分区。

```bash
~# parted /dev/nvme1n1
GNU Parted 3.2 
Using /dev/xvdg 
Welcome to GNU Parted! Type 'help' to view a list of commands.
(parted) mklabel gpt  #使用gpt分区格式将使得前1024个扇区被占用。
(parted) mkpart bbp 1MB 2MB # 由于前1024个扇区被占用，所以这里的开始地址为1024kb即1MB，bbp为分区名字，即BIOS boot partition，需要占用1MB，所以结束地址为2MB
(parted) set 1 bios_grub on #设置分区1为BIOS boot partition
(parted) mkpart root xfs 2MB 100% #剩下的空间即2MB～100%的空间分给root分区。

```
分区完之后再次使用`lsblk`我们可以看到
```bash
NAME        MAJ:MIN RM SIZE RO TYPE MOUNTPOINT
nvme0n1     259:0    0   20G  0 disk 
├─nvme0n1p1 259:1    0   1M  0 part 
└─nvme0n1p2 259:2    0   20G  0 part /
nvme1n1     270:0    0   8G  0 disk 
├─nvme1n1p1 270:1    0   1M  0 part 
└─nvme1n1p2 270:2    0   8G  0 part /
```
可以看到多了两个分区nvme1n1p1和nvme1n1p2，其中nvme1n1p2是我们的根分区。
使用以下命令对分区进行格式化：
```bash
mkfs.xfs /dev/nvme1n1p2
```
格式化之后我们要对该分区进行挂载，比如我们挂载到/mnt/myroot上。
```bash
mkdir -p /mnt/myroot
mount /dev/nvme1n1p2 /mnt/myroot
```
#### （3 使用rsync将文件系统转移到新卷的根分区上。
```bash
sudo rsync -axv / /mnt/myroot/ 
```
注意上面的`-x` 参数很重要，因为是备份当前实例的根目录，
所以如果不加这个参数就会备份/mnt/myroot它自身到/mnt/myroot里陷入死循环。
rsync命令与cp命令不同，cp命令会覆盖，而rsync则是同步增量备份，已经有到文件不会被复制过去。能节省很多时间。
等待一段时间同步完。

### 3.修改相应文件里面的uuid。
由于换了一个卷，尽管同步了文件，但是由于卷的uuid变了，所以引导参数会变，主要有以下两个文件需要改:
```bash
/boot/grub2/grub.cfg #有的地方不是grub2是grub
/etc/fstab
```
那么需要改什么呢？首先需要通过blkid列出相关卷的uuid：
```bash
[root@ip-172-31-16-92 boot]# sudo blkid
/dev/nvme0n1p2: LABEL="/" UUID="add39d87-732e-4e76-9ad7-40a00dbb04e5" TYPE="xfs" PARTLABEL="Linux" PARTUUID="47de1259-f7c2-470b-b49b-5e054f378a95"
/dev/nvme1n1p2: UUID="566a022f-4cda-4a8a-8319-29344c538da9" TYPE="xfs" PARTLABEL="root" PARTUUID="581a7135-b164-4e9a-8ac4-a8a17db65bef"
/dev/nvme0n1: PTUUID="33e98a7e-ccdf-4af7-8a35-da18e704cdd4" PTTYPE="gpt"
/dev/nvme0n1p1: PARTLABEL="BIOS Boot Partition" PARTUUID="430fb5f4-e6d9-4c53-b89f-117c8989b982"
/dev/nvme1n1: PTUUID="0dc70bf8-b8a8-405c-93e1-71c3b8a887c7" PTTYPE="gpt"
/dev/nvme1n1p1: PARTLABEL="bbp" PARTUUID="82075e65-ae7c-4a90-90a1-ea1a82a52f93"
```

可以看到旧的大EBS卷的根分区的uuid是`add39d87-732e-4e76-9ad7-40a00dbb04e5`,新的小EBS卷的uuid是`566a022f-4cda-4a8a-8319-29344c538da9`。使用sed命令替换即可：
```bash
sed 's/add39d87-732e-4e76-9ad7-40a00dbb04e5/566a022f-4cda-4a8a-8319-29344c538da9/g' /boot/grub2/grub.cfg
sed 's/原字符串/替换字符串/g' /etc/fstab
```

当然厉害的同学也可以尝试自己手动生成grub文件，使用`grub-install` （有些系统是`grub2-install`）这里只是为了方便起见。


### 4.更换断开旧卷替换新卷。
之后先使用`umount`取消新ebs卷的挂载：
```bash
umount /mnt/myroot/ 
```
如果提示target is busy.可以使用` fuser -mv /mnt/myroot`查看是哪个进程在占用。我查到的是bash，说明要在bash中退出这个目录才行，使用`cd` 回到home目录再次输入命令即可取消挂载。

之后断开旧卷，替换新卷为根设备，方法是填写这里的设备名称。如下图的/dev/xvda
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/2a2da948b88a22d352a8757b0f7e2a7b.png)
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/c57d309aa7f58f9bfca02e563df5c43e.png#pic_center)





如果启动不成功ssh连不上可以使用以下方法进行调试：
#### 1. 获取系统日志
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/0f3f5a712e9ab387d1677df267d1a016.png#pic_center)
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/c9f7307b81d29e99dc99a6eab1857062.png#pic_center)

#### 2.获取屏幕截图
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/fd5f6063360b7401a9bbbb6d3393d006.png#pic_center)
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/3730d2952fb0d65fc4f35c1fe4bada52.png#pic_center)



参考：
1.https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/TroubleshootingInstances.html#InitialSteps
2.https://www.daniloaz.com/en/partitioning-and-resizing-the-ebs-root-volume-of-an-aws-ec2-instance/
3.https://medium.com/@m.yunan.helmy/decrease-the-size-of-ebs-volume-in-your-ec2-instance-ea326e951bce

-------------------------------------------
广告：有需要帮忙的朋友可以光顾我的淘宝店，偶也要恰饭：
https://item.taobao.com/item.htm?id=611472676656
