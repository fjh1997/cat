---
title: 使用ddddocr离线识别二维码
date: 2023-11-06 12:47:00
tags:
---

```bash
python -m pip install ddddocr
```

```python
from PIL import Image
if not hasattr(Image, 'ANTIALIAS'):
    setattr(Image, 'ANTIALIAS', Image.LANCZOS)
import ddddocr
from io import BytesIO


import requests

cookies = {
    'PHPSESSID': '4vohlqid5teq336hgg058oso0e',
}

headers = {
    'Host': '10.1.3.101:801',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.5735.110 Safari/537.36',
    'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
    'Referer': 'http://10.1.3.101/',
    # 'Accept-Encoding': 'gzip, deflate',
    'Accept-Language': 'zh-CN,zh;q=0.9',
    'Connection': 'close',
    # 'Cookie': 'PHPSESSID=4vohlqid5teq336hgg058oso0e',
}

params = {
    'c': 'main',
    'a': 'getCode',
    'v': '3.3.2_1699162636086',
}

response = requests.get('http://10.1.3.101:801/eportal/', params=params, cookies=cookies, headers=headers, verify=False)



ocr = ddddocr.DdddOcr()
'''
with open('test.gif', 'rb') as f:

    img_bytes = f.read()
'''
img = Image.open(BytesIO(response.content))

res = ocr.classification(response.content)
img.show()

print(res)
```

