---
title: 记一次CTF的USB流量分析
abbrlink: 10389
date: 2020-04-29 16:20:02
tags:
---

# usb鼠标流量
最近在研究鼠标流量，找到如下的文章：
https://www.cnblogs.com/hackxf/p/10670844.html
根据这个师傅的说法，不同的鼠标抓到的流量不一样，一般的鼠标流量是四个字节，第一个字节表示按键指示左键右键，第二个字节表示水平位移，为正（小于127）是向右移动，为负（补码负数，大于127小于255）是向左移动。第三个字节表示垂直位移，为正（小于127）是向上移动，为负（补码负数，大于127小于255）是向下移动。事实上，起作用的只是三个相邻的字节。
然而，有些鼠标的流量似乎不那么标准，比如上面那个师傅，他抓出来的流量是8字节的，于是他就取了1、2、3字节来进行分析。而我抓到的流量是6字节的。
如下图：
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/4d4e90e2cecec84ccde32af472335958.jpeg)

经过分析，我对应的起作用的字节是2、3、4字节，稍微修改了下师傅的脚本。
```python3
#sniffer.py
nums = []
keys = open('usbdata.txt','r')
result=open('result.txt','w')
posx = 0
posy = 0
for line in keys:
    if len(line) != 18 :#忽略空行
         continue
    x = int(line[6:8],16)
    y = int(line[9:11],16)
    if x > 127 :
        x -= 256
    if y >127 :
        y -=256
    posx += x
    posy += y
    btn_flag = int(line[3:5],16)  # 1 for left , 2 for right , 0 for nothing
    if btn_flag == 1 :
        result.write(str(posx)+' '+str(posy)+'\n')
keys.close()
result.close()
```
同时在控制台里面运行以下命令出来了结果。
```bash
tshark -r test2.pcapng -T fields -e usb.capdata > usbdata.txt
python3 sniffer.py
gnuplot.exe -e "plot 'result.txt'" -p
```
但是这样的图像出来是反的。
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/02654372825fe969e4792584e70be12e.png)

于是我又加了个负号。
```python3
#sniffer.py
nums = []
keys = open('usbdata.txt','r')
result=open('result.txt','w')
posx = 0
posy = 0
for line in keys:
    if len(line) != 18 :#忽略空行
         continue
    x = int(line[6:8],16)
    y = int(line[9:11],16)
    if x > 127 :
        x -= 256
    if y >127 :
        y -=256
    posx += x
    posy += y
    btn_flag = int(line[3:5],16)  # 1 for left , 2 for right , 0 for nothing
    if btn_flag == 1 :
        result.write(str(posx)+' '+str(-posy)+'\n')
keys.close()
result.close()
```
图像正了，但还是有倾斜，又反复试了多次，和画图的结果还是不太一样。
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/10d4b7f130af96c3b7e6d70416041c61.png)
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/84a3549d974e998cc2bc2cf162d9dcef.png)
经过对比，稍微调整了参数,具体的参数作用注释里面有说明
```python3
#sniffer.py
nums = []
keys = open('usbdata.txt','r')
result=open('result.txt','w')
posx = 0
posy = 0
for line in keys:
    if len(line) != 18 :#忽略空行
         continue
    x = int(line[6:8],16)
    y = int(line[9:11],16)
    if x > 127 :
        x -= 256
    if y >120 :#这个参数控制单个字符的高度，如果高度过大导致字符过瘦，请调大
        y -=264#这个参数控制字符串的倾斜程度，如果向下倾斜就调高，如果向上倾斜就调低
    posx += x
    posy += y
    btn_flag = int(line[3:5],16)  # 1 for left , 2 for right , 0 for nothing
    if btn_flag == 1 :
        result.write(str(posx)+' '+str(-posy)+'\n')
keys.close()
result.close()
```
这下结果就比较接近了。
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/1b077a0301475580d15ce5e373f98979.jpeg)
流量详见附件：
https://download.csdn.net/download/fjh1997/12374482
## 2. USB键盘流量
usb键盘流量就容易的多，主要起作用的是七个字节（1、3～8）。键盘流量只记录按下的按键。释放按键不进行记录。

在mac os catalina 15上面抓usb流量比较方便
>重启Mac,进入恢复模式
> 在终端里面输入csrutil disable关闭SIP保护
> 再次重启之后使用命令sudo ifconfig XHC20 up
开启端口之后使用wireshark抓包即可。
```yaml
BYTE1 --
       |--bit0:   Left Control是否按下，按下为1 
       |--bit1:   Left Shift  是否按下，按下为1 
       |--bit2:   Left Alt    是否按下，按下为1 
       |--bit3:   Left GUI    是否按下，按下为1 
       |--bit4:   Right Control是否按下，按下为1  
       |--bit5:   Right Shift 是否按下，按下为1 
       |--bit6:   Right Alt   是否按下，按下为1 
       |--bit7:   Right GUI   是否按下，按下为1 
BYTE2 -- 暂不清楚，有的地方说是保留位
BYTE3--BYTE8 -- 这六个为普通按键
```

详细的对照表可以去这里看：
https://www.usb.org/sites/default/files/documents/hut1_12v2.pdf
但是在抓包的时候也需要注意一些点同时在抓流量的时候也会遇到一些问题，比如8个字节都是0的USB流量太多以及其他USB设备的流量的干扰，需要用filter“usb.capdata != 00:00:00:00:00:00:00:00 and usb.src == "96.1.1"”进行过滤，如下图。
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/d6381bc1faa60a3ec6767ad55a56002c.png)
再比如同样一个s没加shift是0000160000000000，加了shift之后是0200160000000000
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/1d6a591f4da560bca01a2412e4e033a7.png)

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/4486aaa260ff5d7ec713e94040045a73.png)
有些时候也会遇到多个按键一起按的情况，这个时候3～8字节可能会被利用起来。
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/713dc2f1cb24752817ee2202713dde41.png)
这里我做了一个实验，输入”hello I'm good“之后查看抓到的流量是什么：

```python
import os
os.system("tshark -r test.pcapng -T fields -e usb.capdata > usbdata.txt")
normalKeys = {"04":"a", "05":"b", "06":"c", "07":"d", "08":"e", "09":"f", "0a":"g", "0b":"h", "0c":"i", "0d":"j", "0e":"k", "0f":"l", "10":"m", "11":"n", "12":"o", "13":"p", "14":"q", "15":"r", "16":"s", "17":"t", "18":"u", "19":"v", "1a":"w", "1b":"x", "1c":"y", "1d":"z","1e":"1", "1f":"2", "20":"3", "21":"4", "22":"5", "23":"6","24":"7","25":"8","26":"9","27":"0","28":"<RET>","29":"<ESC>","2a":"<DEL>", "2b":"\t","2c":"<SPACE>","2d":"-","2e":"=","2f":"[","30":"]","31":"\\","32":"<NON>","33":";","34":"'","35":"<GA>","36":",","37":".","38":"/","39":"<CAP>","3a":"<F1>","3b":"<F2>", "3c":"<F3>","3d":"<F4>","3e":"<F5>","3f":"<F6>","40":"<F7>","41":"<F8>","42":"<F9>","43":"<F10>","44":"<F11>","45":"<F12>"}

shiftKeys = {"04":"A", "05":"B", "06":"C", "07":"D", "08":"E", "09":"F", "0a":"G", "0b":"H", "0c":"I", "0d":"J", "0e":"K", "0f":"L", "10":"M", "11":"N", "12":"O", "13":"P", "14":"Q", "15":"R", "16":"S", "17":"T", "18":"U", "19":"V", "1a":"W", "1b":"X", "1c":"Y", "1d":"Z","1e":"!", "1f":"@", "20":"#", "21":"$", "22":"%", "23":"^","24":"&","25":"*","26":"(","27":")","28":"<RET>","29":"<ESC>","2a":"<DEL>", "2b":"\t","2c":"<SPACE>","2d":"_","2e":"+","2f":"{","30":"}","31":"|","32":"<NON>","33":"\"","34":":","35":"<GA>","36":"<","37":">","38":"?","39":"<CAP>","3a":"<F1>","3b":"<F2>", "3c":"<F3>","3d":"<F4>","3e":"<F5>","3f":"<F6>","40":"<F7>","41":"<F8>","42":"<F9>","43":"<F10>","44":"<F11>","45":"<F12>"}


nums = []
keys = open('usbdata.txt')
for line in keys:
    if len(line)!=17: #首先过滤掉鼠标等其他设备的USB流量
         continue
    nums.append(line[0:2]+line[4:6]) #取一、三字节
keys.close()
output = ""
for n in nums:
    if n[2:4] == "00" :
        continue

    if n[2:4] in normalKeys:
        if n[0:2]=="02": #表示按下了shift
            output += shiftKeys [n[2:4]]
        else :
            output += normalKeys [n[2:4]]
    else:
        output += '[unknown]'
print('output :n' + output)

```
得到如下结果：
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/fb68e067bbf8de417bfda80f59add0cb.png)

