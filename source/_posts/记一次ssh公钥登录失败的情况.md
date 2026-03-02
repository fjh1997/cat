---
title: 记一次奇怪的ssh公钥登录失败的情况
date: 2026-02-15 10:40:13
tags:
---
配置了公钥之后提示登录失败，于是开启了-vvv模式，提示：
```bash
debug1: Offering public key: /Users/jihanfu/.ssh/id_rsa RSA SHA256:HYJ/2VQ9GbMqG8KZAHfuNlcU+j8qWeQSTi+NEZFR1Tw
debug3: send packet: type 50
debug2: we sent a publickey packet, wait for reply
debug3: receive packet: type 51
debug1: Authentications that can continue: publickey,password
debug1: Trying private key: /Users/jihanfu/.ssh/id_ecdsa
debug3: no such identity: /Users/jihanfu/.ssh/id_ecdsa: No such file or directory
debug1: Trying private key: /Users/jihanfu/.ssh/id_ecdsa_sk
debug3: no such identity: /Users/jihanfu/.ssh/id_ecdsa_sk: No such file or directory
```
注意到中间receive packet: type 51，收到了51，代表不接受我发送的公钥的指纹，然后我使用命令检查了一下我的私钥派生的公钥
```bash
➜  CSDN git:(main) ✗ ssh-keygen -y -f ~/.ssh/id_rsa
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQCzNv9/IPwLbklJEJWdCGKPSOb/2ePExmC6/lXN2Zj+4ZcEc3hupGRB0CU736moTlDN0A8DmEHmjRnKybA4yA7uNPYLp3
```
居然和linux上面的~/.ssh/authorized_keys里面的内容时一样的，这就很奇怪了。公钥明明正确但不接受。
之后去问了一下gemini，gemini建议我检查一下指纹，于是我检查了一下指纹。
```bash
 CSDN git:(main) ✗ ssh-keygen -l -f <(ssh-keygen -yf ~/.ssh/id_rsa )
3072 SHA256:BrDxupUTSNIgnoX+lIpuOVoqr4K4sqL3LniG4cDImAc jihanfu@jihandeMacBook-Pro.local (RSA)
```
发现指纹不匹配。BrDxupUTSNIgnoX+lIpuOVoqr4K4sqL3LniG4cDImAc，但我实际发送的是HYJ/2VQ9GbMqG8KZAHfuNlcU+j8qWeQSTi+NEZFR1Tw. 
之后再次问了gemini，得到一个可能性，虽然日志里面写的是读取公钥文件 Offering public key: /Users/jihanfu/.ssh/id_rsa. 
但实际上读的是/Users/jihanfu/.ssh/id_rsa.pub. 
之后检查了一下id_rsa.pub，果然：
```bash
➜  CSDN git:(main) ✗ ssh-keygen -l -f ~/.ssh/id_rsa.pub
3072 SHA256:HYJ/2VQ9GbMqG8KZAHfuNlcU+j8qWeQSTi+NEZFR1Tw jihanfu@jihandeMacBook-Pro.local (RSA)
```
这里的指纹和发送过去的对的上，所以说ssh的日志本身具有误导性，ssh在有id_rsa.pub的时候会读id_rsa.pub，没有的时候会从id_rsa文件派生。
而这个id_rsa.pub文件因为错误配置导致和id_rsa文件匹配不上了。
因此删除不一样的id_rsa.pub之后果然即可成功登录。