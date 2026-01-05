---
title: 合并多个excel的行到一个excel
date: 2021-08-28 15:28:48
tags:
---

```python
from pathlib import Path
import pandas as pd 
excels = [pd.read_excel(path,header=4) for path in Path('.').rglob('*.xls*')]
#这里的4指的是表格头占4行，一般是占1行
print(excels)
df = pd.concat(excels) 
df.to_excel('汇总.xlsx', index=False) 
```

