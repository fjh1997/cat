---
title: MikTex+texworks插入数学公式示例
abbrlink: 21526
url: /posts/21526.html
date: 2019-06-11 17:33:35
tags:
---

```LaTex
\documentclass{article}
\begin{document}
$\Phi(x)=F(x ; 0,1)=\frac{1}{\sqrt{2 \pi}} \int_{-\infty}^{\infty} \exp \left(-\frac{t^{2}}{2}\right) d t$
\end{document}
```
![在这里插入图片描述](/images/d1ac97178f27faf507624c3eaf958e5b.jpeg)
需要指出的是，第一句话指明本document所属的类，接下来的环境变量会从该类中寻找，而\begin{document}则是整个document的起点，相当于程序中的主函数main()
效果如下：
![在这里插入图片描述](/images/5c1195f29ec7ecb3057837685bbf8697.jpeg)
```latex
\documentclass{article}
\usepackage{amsmath}
%注意以上这个包要加上去
\begin{document}
\begin{equation} 
y=
\begin{cases} 
1,\text{DAYS\_FROM\_LAST\_TO\_END} >= \text{MAX\_FLIGHT\_INTERVAL}
\\
0,\text{DAYS\_FROM\_LAST\_TO\_END} < \text{MAX\_FLIGHT\_INTERVAL}
\end{cases}
\end{equation} 
\end{document}
```

效果如下：
![在这里插入图片描述](/images/7739e0da198275cd725386a45a2c8fa5.jpeg)
