---
title: ctf没有cat等程序等情况下读取flag
date: 2021-07-25 21:32:26
tags:
---

tcsh 读10行
```bash
echo '@ num = 10\nwhile ( $num > 1 )\n    set word = "$<"\n    echo "$word"\n    @ num -= 1\n    # rest of code...\nend\n' > /b.sh && source /b.sh < /etc/ctf/flag.txt
```
bash
```bash
echo $(</etc/ctf/flag.txt)
```
