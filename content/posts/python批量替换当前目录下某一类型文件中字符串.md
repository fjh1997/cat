---
title: python批量替换当前目录下某一类型文件中字符串
abbrlink: 3072
url: /posts/3072.html
date: 2019-05-31 12:33:31
tags:
---

```python
# -*- coding: utf-8 -*- 
import os
import io
def alter(file,old_str,new_str):
    """
    替换文件中的字符串
    :param file:文件名
    :param old_str:就字符串
    :param new_str:新字符串
    :return:
    """
    file_data = ""
    with io.open(file, "r", encoding="utf-8") as f:
        for line in f:
            if old_str in line:
                line = line.replace(old_str,new_str)
            file_data += line
    with io.open(file,"w",encoding="utf-8") as f:
        f.write(file_data)
 
 
#列出当前目录下所有文件
file_dir = './'


def file_name(file_dir): 
    L=[] 
    for root, dirs, files in os.walk(file_dir):
        for file in files:
        	#指定要替换的文件类型
            if os.path.splitext(file)[1] == '.php':
                L.append(os.path.join(root, file))
    return L
 
 
for i in file_name(file_dir):
    print(i)
    alter(i,'mysql_query($sql)','mysqli_query($con,$sql)')
    alter(i,'mysql_fetch_array','mysqli_fetch_array')
    alter(i,'mysql_error()','mysqli_error($con)')
    alter(i,'mysql_real_escape_string($value)','mysqli_real_escape_string($con,$value)')
    ```

