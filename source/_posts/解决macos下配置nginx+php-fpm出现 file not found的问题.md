---
title: 解决macos下配置nginx+php-fpm出现 file not found的问题
date: 2020-03-28 22:20:35
tags:
---

原配置文件/usr/local/etc/nginx/servers/discuz.php

```bash
server {
        listen       8081;
        server_name  localhost;  
        location / {
            root   html;
            index  index.html index.htm;
        }    
        error_page   500 502 503 504  /50x.html;
        location = /50x.html {
            root   html;
        }    
        # pass the PHP scripts to FastCGI server listening on 127.0.0.1:9000
        #
        location ~ \.php$ {
           root           html; #这里要删去
            fastcgi_pass   127.0.0.1:9000;
            fastcgi_index  index.php;
            fastcgi_param  SCRIPT_FILENAME  /scripts$fastcgi_script_name;
            include        fastcgi_params;
        }

```
修改为：
```bash
  server {
        listen       8081;
        server_name  localhost;
        root /Users/fjh1997/upload; #这里要注意
        #charset koi8-r;

        #access_log  logs/host.access.log  main;

        location / {
	   
            index  index.php;
        }

        #error_page  404              /404.html;

        # redirect server error pages to the static page /50x.html
        #
        error_page   500 502 503 504  /50x.html;
        location = /50x.html {
            root   html;
        }

        # proxy the PHP scripts to Apache listening on 127.0.0.1:80
        #
        #location ~ \.php$ {
        #    proxy_pass   http://127.0.0.1;
        #}

        # pass the PHP scripts to FastCGI server listening on 127.0.0.1:9000
        #
        location ~ \.php$ {
            fastcgi_pass   127.0.0.1:9000;
            fastcgi_index  index.php;
            fastcgi_param  SCRIPT_FILENAME  $document_root$fastcgi_script_name;
            include        fastcgi_params;
        }

        # deny access to .htaccess files, if Apache's document root
        # concurs with nginx's one
        #
        #location ~ /\.ht {
        #    deny  all;
        #}
    }

```
需要注意的是，务必删去  location ~ \.php$ {里面的root项，同时修改/scripts$fastcgi_script_name;为$document_root$fastcgi_script_name;，并在location外层添加root项。如本例为/Users/fjh1997/upload;
