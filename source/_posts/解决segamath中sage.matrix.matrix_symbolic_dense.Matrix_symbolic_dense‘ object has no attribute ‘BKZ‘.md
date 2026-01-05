---
title: 解决segamath中sage.matrix.matrix_symbolic_dense.Matrix_symbolic_dense‘ object has no attribute ‘BKZ‘
date: 2020-07-05 14:20:23
tags:
---

主要原因是这个矩阵是属于符号矩阵，也就是里面的元素不全是整型。
解决方法是去寻找之前的运算中有没有出现sage.symbolic.expression.Expression类型的数字，需要把它转化为int类型的数字或者sage.rings.integer.Integer类型的数字，例子如下：
假设public_key是一个多项式为2x\^3+2x\^2+1那么使用public_key.list()可以提取出他的系数数组为[2,2,0,1]
但这个数组是表达式类型。
```bash
Matrix.circulant(pub_key.list())
```

应改为
```bash
Matrix.circulant([ int(i) for i in pub_key.list()])
```
强制转化这个list里面的类型。
