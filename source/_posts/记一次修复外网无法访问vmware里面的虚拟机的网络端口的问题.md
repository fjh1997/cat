---
title: 记一次修复外网无法访问vmware里面的虚拟机的网络端口的问题
date: 2023-12-27 16:18:29
tags:
---

发现一个奇怪的网络问题，vmware里一个程序的端口通过vmnat穿透出来，然后这个端口就能够通过局域网被其他机器访问，但是另一个网段就没法访问这个端口。使用主机上的其他程序使用开启同样的端口，另一个网段的机器却可以访问。我想不出有什么原因会导致这个结果。防火墙也关了。

难道vmnat自带防火墙会识别不是同一网段的ip嘛？

但是奇怪的是，同样是外部网段，10.10网段却可以访问。
之后灵光一现，我们校园网无线wifi给设备分配的网段恰好是172.19.0.1/24，而虚拟机里面的docker的bridge网段恰好也是172.19.0.1/24，导致iptable里面把对外面的流量全部导到docker容器了

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/a87bdc80bc027c402ed8e17fdf9b5a2f.png)

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/d35e06ba6ff3af2f2ff71c92463bfc18.png)



得给docker设置一个不冲突的ip网段才行。

随便瞎想一个。
通过ip addr查到接口名称，里面包含了网络的id格式为br-id
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/2633f7a8af394c63a0b06215abe5669d.png)

docker network ls通过网络id查到是哪个docker-compose项目创建的这个网络。
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/595b3051fd0508f458b64398f0d5c7c3.png)

然后找到哪个docker-compose.yaml文件创建的这个网络去里面改网络即可。因为docker的网络修改只能通过删除后创建来修改。

```yaml
networks:
    default:
    internal:
        internal: true
        ipam:
            config:
              - subnet: 172.168.0.0/24
```

