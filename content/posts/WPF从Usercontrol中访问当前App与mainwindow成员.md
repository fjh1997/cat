---
title: WPF从Usercontrol中访问当前App与mainwindow成员
abbrlink: 18792
url: /posts/18792.html
date: 2020-08-17 21:55:11
tags:
---

```csharp
(App.Current as App).test = 2;
(Application.Current.MainWindow as MainWindow).test = 3;
```

