---
title: 模仿netcat写的python socket通信程序
abbrlink: 5076
url: /posts/5076.html
date: 2020-08-24 19:12:02
tags:
---

netcat有一个特点就是收发是不阻塞的。
使用```nc -l 12345```和```nc localhost 12345```
 进行测试，可以看到实时的收发信息：


![在这里插入图片描述](/images/cb1038b31e0e57ef81a52a5fe8d1714c.png#pic_center)
然而在python中socket在recv()的时候会进行阻塞，如果客户端和服务端都在等待接收会造成死锁，故特此编写了个简单的例子实现python socket编程同时收发。（当然也可以模仿netcat异步非阻塞编程，但要用到select）
服务端
```python
import socket
from threading import Thread

sock = socket.socket()
sock.bind(('127.0.0.1', 10235))
sock.listen(1)
conn, addr = sock.accept()
print('connected:', addr)

def recv():
    while True:
        data = conn.recv(1024).decode()
        if not data: break
        print("Received:"+data)
def send():
    while True:
        conn.send(input().encode())

Thread(target=recv).start()
Thread(target=send).start()

```
客户端
```python
 import socket
from threading import Thread

sock = socket.socket()
sock.connect(('127.0.0.1', 10235))
def recv():
    while True:
        data = sock.recv(1024).decode()
        if not data: break
        print("Received:"+data)
def send():
    while True:
        sock.send(input().encode())

Thread(target=recv).start()
Thread(target=send).start()
 ```
现在python也能实时收发了

![在这里插入图片描述](/images/634fe8756ac357780ac0eeeac7302cc0.png#pic_center)

