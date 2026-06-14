---
title: 离线视频ocr识别
abbrlink: 18924
url: /posts/18924.html
date: 2023-11-10 16:27:25
tags:
---

```bash
sudo apt-get install libleptonica-dev libtesseract-dev
sudo apt-get install tesseract-ocr-chi-sim
python -m pip  install video-ocr
```



windows安装方法：
下载安装
https://digi.bib.uni-mannheim.de/tesseract/tesseract-ocr-w64-setup-5.3.3.20231005.exe

下载
```bash
wget https://github.com/simonflueckiger/tesserocr-windows_build/releases/download/tesserocr-v2.6.0-tesseract-5.3.1/tesserocr-2.6.0-cp311-cp311-win_amd64.whl
pip install tesserocr-2.6.0-cp311-cp311-win_amd64.whl
git clone https://github.com/PinkFloyded/video-ocr.git
cd video-ocr
notepad setup.py

```
去掉版本依赖，修改如下：

```bash
 install_requires=[
        "tesserocr",
        "scipy",
        "opencv-python",
        "numpy",
        "tqdm",
        "click",
        "Pillow",
    ],
```
之后安装
```bash
python setup.py install
```

如果遇到

> RuntimeError: Failed to init API, possibly an invalid tessdata path: ./

则需要设置环境变量TESSDATA_PREFIX为C:\Program Files\Tesseract-OCR\tessdata\

默认只能识别英文，所以要把包改掉

查看默认位置：

```python
Python 3.10.12 (main, Jun 11 2023, 05:26:28) [GCC 11.4.0] on linux
Type "help", "copyright", "credits" or "license" for more information.
>>> import video_ocr
>>> video_ocr.__file__
'/home/catcatyu/.local/lib/python3.10/site-packages/video_ocr.py'
>>>
```

```powershell
nano /home/catcatyu/.local/lib/python3.10/site-packages/video_ocr.py
```

修改124行添加lang=chi_sim 参数。
```python
def _ocr(frame):
    pil_image = Image.fromarray(frame.image)
    text = tesserocr.image_to_text(pil_image,lang="chi_sim") #这行
    frame.text = text
    pbar.update()
    return frame
   ```
   之后使用
   

```bash
video-ocr --sample_rate 10  1.mp4
```
即可识别。
效果：


![在这里插入图片描述](/images/0165ee9d311961bbbaf4d73a9ee4ae5b.png)
![在这里插入图片描述](/images/764c52c73bb77e62472d9bc4c6086c41.png)


 使用`--sample_rate` 参数可以提高精度数字越大越好
