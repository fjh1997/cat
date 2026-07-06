---
title: powershell批量修改文件编码
abbrlink: 22390
url: /posts/22390.html
date: 2024-01-21 18:24:36
tags:
---

```powershell
gci . -recurse -filter *.c| % {
		$MyFile = gc -raw  -Encoding utf8  $_.Fullname
        $MyPath = $_.Fullname
        [System.IO.File]::WriteAllLines($MyPath, $MyFile, [System.Text.UTF8Encoding]($False))
}
```
需要注意的是这里的` -Encoding utf8`这个参数要设置为正确的编码，不然会乱码，除非是带BOM的UTF-8，因为powershell只认BOM的UTF-8,如果不是，就会用ANSI去读，一般是GBK，而如果用`set-content`也会得到带BOM的utf-8文件。
