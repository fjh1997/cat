---
title: 通过markdown表格批量生成格式化的word教学单元设计表格
abbrlink: 64061
date: 2024-09-20 00:21:02
tags:
---

素材：![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/a75f4e40fec44b07a84a5e65c3024ae2.png)
模板：
![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/c997a702fcde4f53a23a0335b67f15ac.png)
代码：

```python
import pandas as pd
from python_docx_replace import docx_replace,docx_get_keys
from docx import Document
from docxcompose.composer import Composer

def parse_markdown_tables(file_path):
    with open(file_path, 'r', encoding='utf-8') as file:
        lines = file.readlines()
    current_table = []
    for line in lines:
        current_table.append(line.strip().replace('<br>', '\n').split('|')[1:-1]) 
    df = pd.DataFrame(current_table[1:], columns=current_table[0])

    return df


df=parse_markdown_tables("单元设计.md")

def convert(num,df):
    print(num)
    doc = Document("template.docx")
    # keys = docx_get_keys(doc) # Let's suppose the Word document has the keys: ${name} and ${phone}
    # print(keys)  #['name', 'week', 'problem', 'location', 'test', 'obj', 'book', 'date', 'seq', 'homework', 'review', 'goal']

    docx_replace(doc,
                book=df.iloc[num].tolist()[8].strip(),
                week=df.iloc[num].tolist()[0].strip(),
                problem=df.iloc[num].tolist()[6].strip(),
                review=df.iloc[num].tolist()[11].strip(),
                name=df.iloc[num].tolist()[3].strip(),
                location=df.iloc[num].tolist()[7].strip(),
                date=df.iloc[num].tolist()[1].strip(),
                homework=df.iloc[num].tolist()[10].strip(),
                seq=df.iloc[num].tolist()[2].strip(),
                test=df.iloc[num].tolist()[9].strip(),
                obj=df.iloc[num].tolist()[4].strip(),
                goal=df.iloc[num].tolist()[5].strip())
    return doc

master = Document("master.docx")# 任意word文档，里面可以包含封面
composer = Composer(master)

for i in range(len(df.axes[0])):
    unit_doc=convert(i,df)
    composer.append(unit_doc)
composer.save("combined.docx")
```
效果，16张表：

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/fjh1997/CSDN@main/source/images/478e07790b204ccf8b20a5c57140107c.png)
项目地址：https://github.com/fjh1997/Unit
