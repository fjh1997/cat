---
title: 构建aosp的时候出现unrecognized module type
abbrlink: 11186
date: 2023-03-13 12:08:37
tags:
---

> error: prebuilts/rust/Android.bp:40:1: unrecognized module type "rust_stdlib_prebuilt_host"
> 
很简单，去相关的目录下执行`git reset --hard`,如以上报错就是cd prebuilts/rust/ & git reset --hard
