---
title: Docker 容器之间无法ping通的原因分析。
abbrlink: 5091
url: /posts/5091.html
date: 2021-07-19 10:49:07
tags:
---

最近配置ctfd遇到了个问题，总是提示

```bash
Waiting for db: to be ready
```
去翻了下docker-entrypoint发现是`ping db`命令ping不通。

docker有着内部的dns，db这个域名会被解析成如172.18.0.4这样的内部地址，`ping db`不通那显然是ip不通的原因。

可问题是，我ctfd的ip是172.18.0.4/24，显然和db的ip在同一网段，但却不通，这是什么原因呢？

看了下这篇文章：
https://maximorlov.com/4-reasons-why-your-docker-containers-cant-talk-to-each-other/

检查了下，发现com.docker.network.bridge.enable_icc也是开了的。那原因估计出在iptables上。
翻看了iptables。发现大概如下，记得要加-v参数：

```bash
ych@ych-XFS:~$ sudo iptables -L -v
Chain INPUT (policy ACCEPT 0 packets, 0 bytes)
 pkts bytes target     prot opt in     out     source               destination

Chain FORWARD (policy DROP 0 packets, 0 bytes)
 pkts bytes target     prot opt in     out     source               destination
 3012  514K DOCKER-USER  all  --  any    any     anywhere             anywhere
 3012  514K DOCKER-ISOLATION-STAGE-1  all  --  any    any     anywhere             anywhere
    0     0 ACCEPT     all  --  any    docker0  anywhere             anywhere             ctstate RELATED,ESTABLISHED
    0     0 DOCKER     all  --  any    docker0  anywhere             anywhere
    0     0 ACCEPT     all  --  docker0 !docker0  anywhere             anywhere
    0     0 ACCEPT     all  --  docker0 docker0  anywhere             anywhere
    0     0 ACCEPT     all  --  any    br-29c148a72898  anywhere             anywhere             ctstate RELATED,ESTABLISHED
    0     0 DOCKER     all  --  any    br-29c148a72898  anywhere             anywhere
   。。。。。。。。省略
```
注意到里面有 DOCKER-ISOLATION-STAGE-1这个target，需要注意的是，这个是一个chain规则，在下面有定义。

```bash
Chain DOCKER-ISOLATION-STAGE-1 (1 references)
 pkts bytes target     prot opt in     out     source               destination
    0     0 DOCKER-ISOLATION-STAGE-2  all  --  docker0 !docker0  anywhere             anywhere
    0     0 DOCKER-ISOLATION-STAGE-2  all  --  br-29c148a72898 !br-29c148a72898  anywhere             anywhere
    8   400 DOCKER-ISOLATION-STAGE-2  all  --  br-864dcc919eb9 !br-864dcc919eb9  anywhere             anywhere
    0     0 DOCKER-ISOLATION-STAGE-2  all  --  br-448d5360c7cf !br-448d5360c7cf  anywhere             anywhere
    0     0 DOCKER-ISOLATION-STAGE-2  all  --  br-3ed5960701d5 !br-3ed5960701d5  anywhere             anywhere
    0     0 DROP       all  --  any    br-34aed53e3bb0 !172.20.0.0/16        anywhere
    0     0 DROP       all  --  br-34aed53e3bb0 any     anywhere            !172.20.0.0/16
 3012  514K RETURN     all  --  any    any     anywhere             anywhere
 ```
 从中发现，这个规则还引用了DOCKER-ISOLATION-STAGE-2  ，在下面有定义：
 ```bash
 Chain DOCKER-ISOLATION-STAGE-2 (5 references)
 pkts bytes target     prot opt in     out     source               destination
    0     0 DROP       all  --  any    docker0  anywhere             anywhere
    0     0 DROP       all  --  any    br-29c148a72898  anywhere             anywhere
    0     0 DROP       all  --  any    br-864dcc919eb9  anywhere             anywhere
    0     0 DROP       all  --  any    br-448d5360c7cf  anywhere             anywhere
    0     0 DROP       all  --  any    br-3ed5960701d5  anywhere             anywhere
    8   400 RETURN     all  --  any    any     anywhere             anywhere 
```
    
总结起来，就是iptables包含4个表：4个表的优先级由高到低：raw-->mangle-->nat-->filter 使用`iptables -t <表格名>  -L -v`查看，默认的是filter表，我们可以看到filter这个规则表有 INPUT、FORWARD 和 OUTPUT 三个规则链，分别控制了入站的网络包，转发的网络包，和出站的网络包。docker在这里配置了FORWARD 也就是路由转发的规则，这个规则引用了 DOCKER-ISOLATION-STAGE-1里的规则，可以理解为为了方便管理创建的一个规则模块，规则引用规则可以减少iptables复杂程度。 DOCKER-ISOLATION-STAGE-1又引用了 DOCKER-ISOLATION-STAGE-2这个规则。

仔细看了下没什么问题。那么问题应该出现在docker的bridge网络上，也就是iptables里面的br-xxxxx。

那么的br-xxx是什么呢？看这篇文章：
https://gobomb.github.io/post/learning-linux-veth-and-bridge/

大概就是

> docker 容器的网络，实现都用到了 VETH 和 Bridge 这两种虚拟设备。大致原理是在主机创建一个
> Bridge，每当一个新的容器创建，就创建一对 VETH，一端连接到主机的
> Bridge，另一端连接到容器命名空间里，作为容器的默认网卡，并将容器的默认路由设置为 Bridge。

在宿主机上使用ip addr或者ifconfig可以看到
```
8: br-29c148a72898: <NO-CARRIER,BROADCAST,MULTICAST,UP> mtu 1500 qdisc noqueue state DOWN group default
    link/ether 02:42:a5:64:f8:04 brd ff:ff:ff:ff:ff:ff
    inet 172.25.0.1/16 brd 172.25.255.255 scope global br-29c148a72898
       valid_lft forever preferred_lft forever
10: vethf0f625d@if9: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue master br-34aed53e3bb0 state UP group default
    link/ether ae:9a:28:aa:73:e2 brd ff:ff:ff:ff:ff:ff link-netnsid 1
    inet6 fe80::ac9a:28ff:feaa:73e2/64 scope link
       valid_lft forever preferred_lft forever
 ```
 这里面的br和veth就是docker使用的虚拟网络设备。
可以使用命令`ip netns list `查看网络命名空间，但是docker创建的网络命名空间我们却查不到，这个原因在这篇文章里面有写：
http://dockone.io/article/5272
我们要从二层三层网络开始解决问题。
打算看这篇文章：https://blog.arunsriraman.com/2017/01/container-namespaces-deep-dive-into.html
当我正准备进一步探索的时候，
学校机房重启了，重启了之后docker的网络就没问题了。

唉，虽说重启、重装大法好，但我却失去了一个很好的探索学习问题的机会，真是遗憾。

三年后我又遇到了，容器之间无法用hostname来dns解析的问题，查看了下network，发现三个容器之间加入网络有问题，两个network一个internal一个default，每次docker-compose down然后up，都只有很小的概率三个容器正确加入网络，其中两个容器应该是default网络，另外三个是internal网络。
