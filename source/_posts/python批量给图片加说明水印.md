---
title: python批量给图片加说明水印
date: 2020-05-06 19:33:59
tags:
---

使用方法是将图片归类到文件夹下面，如图：
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/0487dbd24433bc65e835239fa5a36aec.png)
将以下内容输入到一个文件中，放到最顶目录随便命名比如test.py
```python
import os
import traceback

# -*- coding: utf-8 -*-
from PIL import Image, ImageDraw, ImageFont
 
def add_text_to_image(img,root):
  txt=Image.new('RGBA', img.size, (0,0,0,0))
  fnt=ImageFont.truetype("DENG.TTF", 20)
  d=ImageDraw.Draw(txt)
  d.text((0,txt.size[1]-30), root,font=fnt, fill=(0,0,0,255))
  out=Image.alpha_composite(img, txt)
  sav = out.convert("RGB")
  sav.save(os.path.join(root,file))

 
for root,dirs,files in os.walk('./'):
    for file in files:
      try:
        img=Image.open(os.path.join(root,file)).convert('RGBA')
        add_text_to_image(img,root)
      except Exception as e:
        print(os.path.join(root,file))
        print(e)
        print(traceback.format_exc())

        pass
      
			
```
安装依赖
```bash
pip install pillow
```
运行
```bash
python3 test.py
```
之后每张图片有如下效果，可以做标记用：
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/3dbd4faa02bf1fbb11bdf4533270f48c.png)

