---
title: python将文本隐藏到音频文件中
abbrlink: 38609
url: /posts/38609.html
date: 2020-03-19 12:36:03
tags:
---

编码
```python
import wave

frame_bytes = bytearray()
string='杭州涅普科技有限责任公司出品'
string=string.encode() 
bits = list(map(int, ''.join(['{0:08b}'.format(i) for i in string])))
print(bits)
for i,bit in enumerate(bits):
    print("[",bit,"]",end = '')
    frame_bytes.append(bit*255)
    print("[",bit*255,"]")
frame_modified = bytes(frame_bytes)

# Write bytes to a new wave audio file
with wave.open('song_embedded.wav', 'wb') as fd:
    fd.setparams((1, 1, 44100, 44100, 'NONE', 'not compressed'))
    fd.writeframes(frame_modified)
```
解码
```python
# We will use wave package available in native Python installation to read and write .wav audio file
import wave
# read wave audiaudioo file
song = wave.open("song_embedded.wav", mode='rb')
# Read frames and convert to byte array
frame_bytes = bytearray(list(song.readframes(song.getnframes())))
binstring=''
print(frame_bytes)
for bit in frame_bytes:
   if bit==255:
        binstring=binstring+'1'
   else :
        binstring=binstring+'0'
raw=bytes(int(binstring[i : i + 8], 2) for i in range(0, len(binstring), 8))
print(raw)
print(raw.decode())

```
成功后使用sonic visualiser 打开可以看到高的采样点代表1，低的采样点代表0，如此11100110...这样排列出来就是我们要隐藏的文本信息。
![在这里插入图片描述](/images/77519fe0e6076b90a2af0fee97e44805.jpeg)

