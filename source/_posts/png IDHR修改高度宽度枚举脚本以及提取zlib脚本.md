---
title: png IDHR修改高度宽度枚举脚本以及提取zlib脚本
abbrlink: 18303
date: 2020-04-27 12:51:34
tags:
---

来自夏风师傅的博客：https://blog.xiafeng2333.top/ctf-28/
```python
#python3
import binascii
from Crypto.Util import number
p = open('perceptron2.png','rb').read()
# print(p[0x14:0x17]+chr(0xaf).encode()[-1:])
count = 0
height=160
for width in range(1020,1200):
    data = p[:0x10] +width.to_bytes(4,'big') + height.to_bytes(4,'big')+ p[0x18:0x1d]
    p2 =data + number.long_to_bytes(binascii.crc32(data[0xc:0x1d])&0xffffffff) + p[0x21:]
    p1 = open('te2/'+str(count)+'.png','wb')
    count += 1
    p1.write(p2)
    p1.close()
```

```python
#这里直接提取三个zlib
import re,os
import zlib
c=re.sub(b'........IDAT',b'',open('修改宽度.png','rb').read(),0,re.S)#替换字符串，去掉IDAT头这里的re.S表示让 '.' 特殊字符匹配任何字符，包括换行符,事实上这里的.替换了length和CRC等无关数据为空串，
c=re.sub(b'........IEND....',b'',c,0,re.S)#替换字符串，去掉IEND尾
count=0
zlibhead=b'x\x9c\xed\x9d' #zlib头，注意不要重复
for i in c.split(zlibhead)[1:]:#从1开始是为了丢弃png signature
    open('flag'+str(count)+'.data','wb').write(zlib.decompress(zlibhead+i)) 
    count=count+1




```
根据crc爆破高度：

```python
import os
import binascii
import struct
misc = open("attachment.png","rb").read()

for i in range(1024):
    data = misc[12:20] + struct.pack('>i',i)+ misc[24:29]
    crc32 = binascii.crc32(data) & 0xffffffff
    if crc32 == 0x73B90B29:
        print(i)

```
根据crc爆破宽度：

```python
import os
import binascii
import struct
misc = open("attachment.png","rb").read()

for i in range(1024):
    data = misc[12:16] + struct.pack('>i',i)+ misc[20:29]
    crc32 = binascii.crc32(data) & 0xffffffff
    if crc32 == 0x73B90B29:
        print(i)
```

