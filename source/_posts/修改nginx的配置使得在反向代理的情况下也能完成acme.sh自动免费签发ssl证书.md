---
title: 修改nginx的配置使得在反向代理的情况下也能完成acme.sh自动免费签发ssl证书
date: 2020-04-26 11:42:34
tags:
---


```bash
 server {

        listen       80 ;
        listen       [::]:80 ;
        server_name example.com;
        location ^~ /.well-known/acme-challenge/ {
	        default_type "text/plain";
	        allow all;
	        root /var/www/example.com/;
  		 }
		location /{
	   		rewrite ^(.*)$  https://$host$1 permanent;
	   	}
}
server {
  listen  443 ssl;
  listen       [::]:443 ssl;
  ssl_certificate       /data/example.com.pem;
  ssl_certificate_key   /data/example.com.key.pem;
  ssl_protocols         TLSv1 TLSv1.1 TLSv1.2;
  ssl_ciphers           HIGH:!aNULL:!MD5;
  server_name           example.com;
  client_max_body_size    1000m;
  location ^~ /.well-known/acme-challenge/ {
        default_type "text/plain";
        allow all;
        root /var/www/example.com/;
   }

  location / { 
        proxy_redirect off;
        proxy_pass http://xxxxxxx:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $http_host;

       
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }

  }

```
主要起作用的是 location ^~ /.well-known/acme-challenge/ ，acme在认证的时候会使用这个目录，我们在签发证书的时候使用以下命令即可：


```bash
mkdir -p /var/www/example.com/
chmod a+r /var/www/example.com/
acme.sh --issue -d example.com -w /var/www/example.com/
```
之后安装证书到nginx：

```bash
sudo acme.sh --install-cert -d example.com \
--key-file       /data/example.com.key.pem  \
--fullchain-file /data/example.com.pem \
--reloadcmd     "service nginx force-reload"\
--force
```

