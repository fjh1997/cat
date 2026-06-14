---
title: Kali安装docker
abbrlink: 21600
url: /posts/21600.html
date: 2019-05-28 17:31:07
tags:
---

```shell
sudo apt install    apt-transport-https    ca-certificates  curl    gnupg-agent    software-properties-common
curl -fsSL https://download.docker.com/linux/debian/gpg | sudo apt-key add -
sudo echo "deb [arch=amd64] https://download.docker.com/linux/debian stretch stable" | sudo tee -a /etc/apt/sources.list
sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io

```

