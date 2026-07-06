---
title: 编译与调试adb.exe for windows
abbrlink: 55932
url: /posts/55932.html
date: 2023-03-15 12:52:00
tags:
---

## 0. 需求
至少32G内存，ubuntu 22.04，200G磁盘空间

## 1.下载AOSP源码

```bash
curl -OC - https://mirrors.tuna.tsinghua.edu.cn/aosp-monthly/aosp-latest.tar # 下载初始化包，建议windows下用IDM多线程下载好之后拷过去。
tar xf aosp-latest.tar
cd AOSP   # 解压得到的 AOSP 工程目录
# 这时 ls 的话什么也看不到，因为只有一个隐藏的 .repo 目录
cd .repo/repo #更新repo
git pull # 不然会报reset失败错误
cd -#返回上一个目录
repo init -u https://android.googlesource.com/platform/manifest -b master #切master分支
repo sync -j8# 正常同步一遍即可得到完整目录，八线程
# 或 repo sync -l 仅checkout代码
```
## 2.修改soong文件并编译
代码同步完之后应该会捡出来，编辑Android.bp文件
```
cd packages/modules/adb
nano Android.bp
```
编辑如下：

```bash
index 3013079..0a8c982 100644
--- "a/.\\Android.bp"
+++ "b/.\\Android2.bp"
@@ -39,7 +39,9 @@ cc_defaults {
     name: "adb_defaults",

     cflags: [
-        "-Wall",
+        "-g",
+       "-ggdb",
+       "-Wall",
         "-Wextra",
         "-Werror",
         "-Wexit-time-destructors",
@@ -81,7 +83,8 @@ cc_defaults {
                 //   CreateFileW(path_wide.c_str());
                 "-DUNICODE=1",
                 "-D_UNICODE=1",
-
+               "-gcodeview",
+               "-g",
                 // Unlike on Linux, -std=gnu++ doesn't set _GNU_SOURCE on Windows.
                 "-D_GNU_SOURCE",


@@ -487,7 +489,8 @@ cc_binary_host {
         },
         windows: {
             enabled: true,
-            ldflags: ["-municode"],
+               cflags: ["-g","-gcodeview","-O0"],
+            ldflags: ["-municode","-Wl,--pdb="],
             shared_libs: ["AdbWinApi"],
             required: [
                 "AdbWinUsbApi",
```
主要是加上这几个参数 `cflags: ["-g","-gcodeview",""-O0""], ldflags: ["-municode","-Wl,--pdb="],`取消优化，产生pdb文件。
参数详见：

https://github.com/mstorsjo/llvm-mingw/blob/master/README.md#pdb-support
之后编译即可出现下列报错，没关系，因为symbol被弄到pdb里去了，报错正常。

> FAILED: out/soong/.intermediates/packages/modules/adb/adb/windows_x86/adb.exe
out/host/linux-x86/bin/symbol_inject -i out/soong/.intermediates/packages/modules/adb/adb/windows_x86/unversioned/adb.exe -o out/soong/.intermediates/packages/modules/adb/adb/windows_x86/adb.exe -s soong_build_number -from 'SOONG BUILD NUMBER PLACEHOLDER' -v $(cat out/soong/build_number.txt)
symbol not found

如果还需要调试adb里面涉及到的一些静态库里的代码，如以下这些库：
![在这里插入图片描述](/images/33f70f467e760012aeec1e8c2278c554.png)

则需要去库所在文件夹的android.bp里面添加这几行，确保编译的时候带调试信息，如libbase库的代码在system/libbase目录下(可以用[cvdump](https://github.com/microsoft/microsoft-pdb/blob/master/cvdump/cvdump.exe)查询,也可以在aosp/out/soong/build.ninja里面搜索。)：
```json
 cflags: [
        "-Wall",
        "-Werror",
        "-Wextra",
    ],
 target: {
	\\这几行
        windows: {
             cflags: [
                "-g",
                "-gcodeview",
                "-O0"
            ],
        }
   \\这几行
```
我们可以在`aosp/out/soong/.intermediates/packages/modules/adb/adb/windows_x86/unversioned`找到adb.exe和adb.pdb,之后就可以在windbg里面源码调试了。
