---
title: 1元领养专属"小龙虾"OpenClaw，2核16GB配置/无痛部署/开箱即用并配置内网穿透
date: 2026-03-09 16:00:00
tags:
---

## 1. 打开 ModelScope 官网，登录账户

官网地址：https://www.modelscope.cn/home

![01](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/openclaw-01.webp)

## 2. 授权绑定阿里云账号，完成实名认证

![02](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/openclaw-02.webp)

![03](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/openclaw-03.webp)

![04](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/openclaw-04.webp)

![05](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/openclaw-05.webp)

![06](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/openclaw-06.webp)

## 3. 获取 ModelScope 访问令牌

回到 ModelScope 网站，点击右上角头像，选择"账号设置"，然后点击左侧的"访问控制"，最后点击"新建访问令牌"并复制此令牌。

![07](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/openclaw-07.webp)

![08](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/openclaw-08.webp)

![09](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/openclaw-09.webp)

## 4. 搜索 OpenClaw 创空间

在网站右上角搜索框输入 `BrianZhou/openclaw_computer`，按回车键确认，随后点击搜索结果中展示的创空间。

![10](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/openclaw-10.webp)

![11](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/openclaw-11.webp)

## 5. 复制空间并设置参数

复制该空间，并设置相关参数：

- **是否公开**：选择"非公开"
- **ROOT_PASSWD**：你可以设置任意值，这是云电脑的密码，电脑待机锁屏时需要该密码解锁，请勿忘记
- **MODELSCOPE_API_KEY**：粘贴你刚刚复制的令牌（即本教程第 3 步操作里复制的令牌）

最后点击"复制创空间"。

![12](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/openclaw-12.webp)

![13](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/openclaw-13.webp)

![14](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/openclaw-14.webp)

## 6. 等待云电脑部署完成

![15](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/openclaw-15.webp)

## 7. 进入全屏模式，部署完成

云电脑部署上线后，按照下图操作进入全屏模式。至此，部署完成。

![16](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/openclaw-16.webp)

![17](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/openclaw-17.webp)

---

## 8. 使用 Sakura Frp 进行穿透

先去 sakurafrp 官网 https://www.natfrp.com/user/ 注册用户：

再进行实名认证，需要1元。
![alt text](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/openclaw-image-13.png)

![alt text](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/openclaw-image-14.png)

认证成功之后，在云电脑中先在剪切板里面粘贴命令
![alt text](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/openclaw-image-4.png)
打开终端
![alt text](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/openclaw-image-5.png)
输入：
```
curl -fsSL https://cdn.jsdelivr.net/gh/fjh1997/CTF-@main/sakura_frp.sh -o install_sakura_frp.sh && bash install_sakura_frp.sh
```

![alt text](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/openclaw-image-2.png)
注册完之后复制访问密钥，在剪切板里面粘贴，之后再复制到终端里面：
![alt text](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/openclaw-image-3.png)
![alt text](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/openclaw-image-7.png)
![alt text](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/openclaw-image-6.png)

复制完访问密钥之后，设置远程管理密码，可以看到安装成功的界面：

![alt text](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/openclaw-image-8.png)

以后设备重启后需要输入`bash /mnt/workspace/sakura_frp/start.sh`启动穿透。
之后点击服务-隧道列表：
![alt text](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/openclaw-image-9.png)
随便选一个，可以选浙江移动
![alt text](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/openclaw-image-10.png)
隧道类型选tcp
![alt text](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/openclaw-image-11.png)
选22端口：
![alt text](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/openclaw-image-12.png)
创建成功之后去远程管理页面：
![alt text](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/openclaw-image-15.png)
如果没显示出来多按几下刷新，或者重启服务
![alt text](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/openclaw-image-16.png)
![alt text](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/openclaw-image-17.png)

输入连接密码并连接：
![alt text](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/openclaw-image-18.png)
把创建好的隧道拖到加号上
![alt text](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/openclaw-image-19.png)
成功后会显示连接信息：

![alt text](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/openclaw-image-20.png)
之后使用windterm进行连接，使用用户名root和密码即可：
![alt text](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/openclaw-image-22.png)
![alt text](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/openclaw-image-23.png)
之后上传你需要审计的代码包，如unserialize.zip,拖到左下角小框里：
![alt text](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/openclaw-image-24.png)
之后你和openclaw说话他就会自动帮你审计：
![alt text](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/openclaw-image-25.png)
