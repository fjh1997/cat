---
title: docker备份 named volume
date: 2020-07-02 19:44:49
tags:
---

最近docker出了问题，要重装，但重装可能会导致codimd的volume受到损失，故需要备份，其docker-compose文件如下:

```bash
version: "3"
services:
  database:
    image: postgres:11.6-alpine
    environment:
      - POSTGRES_USER=codimd
      - POSTGRES_PASSWORD=codimd
      - POSTGRES_DB=codimd
    volumes:
      - "database-data:/var/lib/postgresql/data"
    expose:
      - "5432"
    restart: always
  codimd:
    image: nabo.codimd.dev/hackmdio/hackmd:2.0.0
    environment:
      - CMD_DB_URL=postgres://codimd:codimd@database/codimd
      - CMD_USECDN=false
    depends_on:
      - database
    ports:
      - "3002:3000"
    volumes:
      - upload-data:/home/hackmd/app/public/uploads
    restart: always
volumes:
  database-data: {}
  upload-data: {}
```
需要注意的是，其中映射的文件目录/var/lib/postgresql/data和/home/hackmd/app/public/uploads分别对应的是named volume也就是database-data和upload-data。这两个volume比较特殊，被称为named volume在硬盘上是没有对应的文件目录的，也就很难通过拷贝目录的方式备份。
解决方法参考了这个：https://stackoverflow.com/questions/38298645/how-should-i-backup-restore-docker-named-volumes
这里我做了个实用小工具docker_named_volume_backup，项目地址为https://github.com/fjh1997/docker_named_volume_backup。
使用方法很简单：
首先列出你想备份的镜像：
```bash
sudo docker volume ls
```
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/2db7064b6b45ba004f99567db5390f77.png)
可以看到我想备份的是codimd_database-data和codimd_upload-data
之后下载我的小工具。
```bash
git clone https://github.com/fjh1997/docker_named_volume_backup.git
cd docker_named_volume_backup
```
备份：

```bash
#sudo backup_docker_volume.sh <volumn_name> <tar_file>
sudo bash ./backup_docker_volume.sh codimd_database-data backup1.tar
```
恢复：
```bash
#sudo restore_docker_volume.sh <volumn_name> <tar_file>
sudo bash ./restore_docker_volume.sh codimd_database-data backup1.tar
```
