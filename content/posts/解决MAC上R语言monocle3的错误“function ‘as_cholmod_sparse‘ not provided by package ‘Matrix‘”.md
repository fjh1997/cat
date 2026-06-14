---
title: >-
  解决MAC上R语言monocle3的错误“function ‘as_cholmod_sparse‘ not provided by package
  ‘Matrix‘”
abbrlink: 54990
url: /posts/54990.html
date: 2024-02-27 23:18:23
tags:
---



> Error in (function (A, nv = 5, nu = nv, maxit = 1000, work = nv + 7, reorth = TRUE, :
function 'as_cholmod_sparse' not provided by package 'Matrix'

根据这个issue(https://github.com/cole-trapnell-lab/monocle3/issues/690)所说，解决方法是重新编译安装两个库，命令如下：

```
remove.packages("Matrix")
remove.packages("irlba")
install.packages("Matrix",type="source", dependencies=T)
install.packages("irlba",type="source", dependencies=T)

```
当我编译时，遇到了gfortran链接错误

> library not found for lgfortran

我手动从[GitHub](https://github.com/fxcoudert/gfortran-for-macOS/releases)安装了gfortrain for mac，
也设置了软链接：

```bash
ln -s /usr/local/gfortran /opt/gfortran
```

之后按照[文档](https://cran.r-project.org/doc/manuals/r-devel/R-admin.pdf)中所述在~/.R/Makevar中设置了相应路径的链接标志如下所示。

```
FLIBS = -L/opt/gfortran/lib/gcc/aarch64-apple-darwin23/13.2.0 -L/opt/gfortran/lib -lgfortran -lemutls_w -lquadmat
```

然后重新编译即可。
