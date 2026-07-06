---
title: docker-compose 关机或者重启docker同时重启容器restart always的配置
abbrlink: 28306
url: /posts/28306.html
date: 2019-08-08 17:50:58
tags:
---

众所周知，存粹使用docker启动的话需要加--restart=always即可实现这个功能，而使用docker-compose的话在相关服务配置下加    restart: always 就行
```
version: '2'
services:
  database:
    build: ./mysql/
    command: mysqld --user=root --verbose
    restart: always 
    environment:
      MYSQL_DATABASE: "web_level3_sqli"
      MYSQL_USER: "web_level3_sqli"
      MYSQL_PASSWORD: "thisisasecurepassword123"
      MYSQL_ROOT_PASSWORD: "root"
      MYSQL_ALLOW_EMPTY_PASSWORD: "yes"
  web:
    build: ./www/
    restart: always
    ports:
     - "12000:80"
    volumes:
      - ./www/src:/var/www/html
    links:
      - database

```

