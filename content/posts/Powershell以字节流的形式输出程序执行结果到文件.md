---
title: Powershell以字节流的形式输出程序执行结果到文件
abbrlink: 3702
url: /posts/3702.html
date: 2023-03-05 10:57:32
tags:
---


由于powershell 以文本的形式处理了所有管道的输入和输出，因此当数据中有文本编码不可识别的字节的时候会丢失数据，而windows1252可以将0~255任何字节值与字符匹配，基本上可以做到无损转换。
```powershell
[console]::outputencoding=[console]::inputencoding=[System.Text.Encoding]::GetEncoding(1252)
$result=python zipbomb --mode=quoted_overlap --num-files=250 --compressed-size=21179
[IO.File]::WriteAllText("$pwd\result.zip",$result,[System.Text.Encoding]::GetEncoding(1252))
```
或者使用Start-Process和-RedirectStandardOutput
```bash
Start-Process -FilePath "python.exe" -ArgumentList "zipbomb --mode=quoted_overlap --num-files=250 --compressed-size=21179" -RedirectStandardOutput output.zip

```

