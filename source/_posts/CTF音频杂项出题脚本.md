---
title: CTF音频杂项出题脚本
date: 2023-11-28 18:53:19
tags:
---

```python
import wave

zerofile = "ha-d4.wav"
onefile = "ha-gs4.wav"
outfile = "flag.wav"
flag=b"flag{5BChiLd_I5_re411Y_cUTE}"
bits = list(map(int, ''.join(['{0:08b}'.format(i) for i in flag])))

def getframe(file):
    w = wave.open(file, 'rb')
    frame=w.readframes(w.getnframes())
    w.close()
    return frame
    
zeroframe=getframe(zerofile)
oneframe=getframe(onefile)


output = wave.open(outfile, 'wb')

w = wave.open(zerofile, 'rb')
output.setparams(w.getparams())
w.close()

for bit in bits:
    if bit == 0:
        output.writeframes(zeroframe)
    if bit == 1:
        output.writeframes(oneframe)
output.close()
```

