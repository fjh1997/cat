---
title: linux bash多行写入文件不转义
abbrlink: 25400
url: /posts/25400.html
date: 2021-02-10 21:25:55
tags:
---



```bash
haha=1
cat <<TAGTEXTFILE > sometext.txt
$haha
TAGTEXTFILE
```
此时写入的是1
```bash
haha=1
cat <<"TAGTEXTFILE" > sometext.txt
$haha
TAGTEXTFILE
```
此时写入的是$haha
来源：https://superuser.com/questions/695708/shell-how-write-multiline-text-file-without-escaping-special-symbols
https://www.baeldung.com/linux/appending-multiple-lines-to-file2
