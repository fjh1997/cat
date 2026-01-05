---
title: 使用python不改变格式的情况下批量替换word里面的内容
date: 2024-05-24 23:12:37
tags:
---

需要使用如\$name,${id}这样的模板![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/d62dd72cc13eaf61f1847dd3af8d4d10.png)
```python
import os
import io
from python_docx_replace import docx_replace,docx_get_keys
from docx import Document
from random import randrange
student_list='''1,张三,2202330301
2,李四,2202330302
3,王五,2202330303
'''


review=["思路清晰、语言表达准确，整体表现良好","，准备工作一般，整体表现良好","思路清晰、语言表达一般、回答问题有理论依据，","有个别格式不对的需要修改。"]
score=['70', '88', '81']

students=student_list.split("\n")

# print(students)
students_dict_array=[]

for student in students:
    student_dict={}
    student_dict["name"]=student.split(",")[1]
    student_dict["sid"]=student.split(",")[2]
    students_dict_array.append(student_dict)

print(students_dict_array)

# 图片存放的路径
path = "C:\\BaiduSyncdisk\\大学生信息安全竞赛评分表\\"
def alter(file,name,id,num):
    """
    替换文件中的字符串
    :param file:文件名
    :param old_str:就字符串
    :param new_str:新字符串
    :return:
    """
    doc = Document(file)
    keys = docx_get_keys(doc) # Let's suppose the Word document has the keys: ${name} and ${phone}
    print(keys)  # ['name', 'phone']
# call the replace function with your key value pairs
    docx_replace(doc, name=name,id=id,content=review[randrange(len(review))],score=score[num])
    doc.save(os.path.join(path,"new",file))

 
# 遍历更改文件名
num = 0
for file in os.listdir(path):
    alter(os.path.join(path,file),students_dict_array[num]["name"],students_dict_array[num]["sid"],num)
    os.rename(os.path.join(path,file),os.path.join(path,"选手-"+students_dict_array[num]["sid"][-2:]+students_dict_array[num]["name"]+"-记录表")+".doc")
    num = num + 1
```
参考：https://stackoverflow.com/a/72639838/10096812
