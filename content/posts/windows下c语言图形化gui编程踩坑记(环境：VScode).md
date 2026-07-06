---
title: windows下c语言图形化gui编程踩坑记(环境：VScode)
abbrlink: 16770
url: /posts/16770.html
date: 2020-05-18 11:10:54
tags:
---

我平时用的都是Mac和linux系统，但是无奈最近由于研究生复试需要的直播软件只能在windows上面跑，故被逼着用windows系统，而且只能在电脑前面等待一天轮到复试，复试内容是c语言。为了巩固c语言，我只能折腾windows上面的c语言编译器了。我了解的win上的c语言编译器如下：
1.MSVC编译器：这种编译器是微软自家开发的编译器，需要下载VS studio build tools 来安装，需要用到官方的Windows SDK，下载内容比较多，不够轻便。
去微软官方下载生成工具或者vs studio：
[visual studio](https://visualstudio.microsoft.com/zh-hans/downloads/)
![在这里插入图片描述](/images/ff0ce28ca553b6a1b76d8f72ec3da8c3.jpeg)
安装的时候勾选MSVC和windows SDK以及cmake工具即可
![在这里插入图片描述](/images/998984a3928752f1d1d1ef8d30982d02.jpeg)
下载完成后会出现伪终端Developer Command promot for vs 2019
![在这里插入图片描述](/images/5de79e2f7197d4df7be125047b06d801.jpeg)
2.gcc编译器:这种编译器是gnu组织开发的免费自由软件，在windows上面主要有两种，一种是cygwin，支持posix，另一种是mingw，不支持posix，这里推荐的是mingw，下载的内容很少，配合VScode编程可以做很多轻量级运用。
需要注意的是同样的c语言代码在通过MSVC编译器和gcc编译器编译之后的结果是不一样的。


在这里我们下载mingw，首先会遇到一个问题，就是mingw分为两种，即32bit和64bit，每种都有对应的gcc和gdb，我们需要编译32bit的程序的时候就要使用32bit版本的mingw，同理，64位也一样。为了解决这个问题，在linux上面的gcc和gdb都有对应的multilib版本，比如gdb-multilib。
但是根据mingw64的[todolist](https://sourceforge.net/p/mingw-w64/wiki2/TODO%20List/),gcc的multilib版本已经完成，但gdb的multilib还没有。

> Support of multilib build in configure and in gcc. Parts are already present in gcc's 4.5 version by using target triplet -w64-mingw32.
gdb -- Native support is present, but some features like multi-arch support (debugging 32-bit and 64-bit by one gdb) are still missing features.

所以我们姑且先从sourceforge上面下载三个版本即gcc-multilib版本、gdb+gcc 32bit版本、gdb+gcc 64bit版本。
[gcc-multilib](https://sourceforge.net/projects/mingw-w64/files/Multilib%20Toolchains%28Targetting%20Win32%20and%20Win64%29/ray_linn/)
[32bit](https://sourceforge.net/projects/mingw-w64/files/Toolchains%20targetting%20Win64/Personal%20Builds/mingw-builds/8.1.0/threads-win32/sjlj/x86_64-8.1.0-release-win32-sjlj-rt_v6-rev0.7z)
[64bit](https://sourceforge.net/projects/mingw-w64/files/Toolchains%20targetting%20Win32/Personal%20Builds/mingw-builds/8.1.0/threads-win32/sjlj/i686-8.1.0-release-win32-sjlj-rt_v6-rev0.7z)
下载完成之后，跟往常一样，给gcc-multilib里的bin添加环境变量，注意最好不要给另外两个版本添加环境变量，不然可能会有冲突，要添加也是将环境变量path里面居于gcc-multilib里的bin之后。
之后新建文件夹，命名为test，打开该文件夹，在里面创建test.c
输入以下代码：

```c
#include <windows.h>

const char g_szClassName[] = "myWindowClass";

LRESULT CALLBACK WndProc(HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam)
{
    switch(msg)
    {
        case WM_LBUTTONDOWN:
        {
            char szFileName[MAX_PATH];
            HINSTANCE hInstance = GetModuleHandle(NULL);

            GetModuleFileName(hInstance, szFileName, MAX_PATH);
            MessageBox(hwnd, szFileName, "This program is:", MB_OK | MB_ICONINFORMATION);
        }
        break;
        case WM_CLOSE:
            DestroyWindow(hwnd);
        break;
        case WM_DESTROY:
            PostQuitMessage(0);
        break;
        default:
            return DefWindowProc(hwnd, msg, wParam, lParam);
    }
    return 0;
}

int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance,
    LPSTR lpCmdLine, int nCmdShow)
{
    WNDCLASSEX wc;
    HWND hwnd;
    MSG Msg;

    wc.cbSize        = sizeof(WNDCLASSEX);
    wc.style         = 0;
    wc.lpfnWndProc   = WndProc;
    wc.cbClsExtra    = 0;
    wc.cbWndExtra    = 0;
    wc.hInstance     = hInstance;
    wc.hIcon         = LoadIcon(NULL, IDI_APPLICATION);
    wc.hCursor       = LoadCursor(NULL, IDC_ARROW);
    wc.hbrBackground = (HBRUSH)(COLOR_WINDOW+1);
    wc.lpszMenuName  = NULL;
    wc.lpszClassName = g_szClassName;
    wc.hIconSm       = LoadIcon(NULL, IDI_APPLICATION);

    if(!RegisterClassEx(&wc))
    {
        MessageBox(NULL, "Window Registration Failed!", "Error!",
            MB_ICONEXCLAMATION | MB_OK);
        return 0;
    }

    hwnd = CreateWindowEx(
        WS_EX_CLIENTEDGE,
        g_szClassName,
        "The title of my window",
        WS_OVERLAPPEDWINDOW,
        CW_USEDEFAULT, CW_USEDEFAULT, 240, 120,
        NULL, NULL, hInstance, NULL);

    if(hwnd == NULL)
    {
        MessageBox(NULL, "Window Creation Failed!", "Error!",
            MB_ICONEXCLAMATION | MB_OK);
        return 0;
    }

    ShowWindow(hwnd, nCmdShow);
    UpdateWindow(hwnd);

    while(GetMessage(&Msg, NULL, 0, 0) > 0)
    {
        TranslateMessage(&Msg);
        DispatchMessage(&Msg);
    }
    return Msg.wParam;
}
```
这段代码只使用的windows.h这个头文件，注意这个头文件来自mingw，与是否安装windows sdk无关。
之后使用vscode打开的时候选择debug
![在这里插入图片描述](/images/6687be28f8816e81dbadf62b247b7a8e.jpeg)
之后会有提示你，选择gdb即可
![在这里插入图片描述](/images/125894eb88a77b1648b0eb35e818aa92.jpeg)
之后会自动根据你的环境变量设置一个launch.json文件，需要检查的是里面的gdb路径是否相符，假如你要调试的是64位程序，就需要你指定的gdb路径是对应64的。
![在这里插入图片描述](/images/072647a9507a81b4bd6a46e8dc88b0f1.jpeg)
之后返回test.c窗口(不然就是debug launch.json这个文件了，肯定会出错)重新点击debug，会报错让你创建task.json文件
![在这里插入图片描述](/images/66a2ca33fe9d5c6a6c8c3ecb04b6c3c2.jpeg)
选择configure task之后会让你选择编译器，这里需要注意的是msvc的编译器是cl.exe，我们要选gcc.exe不要选错了
![在这里插入图片描述](/images/16be02faa7a5d3ea7299d331a163ab38.jpeg)
在task.json中也要确保路径是对的。
![在这里插入图片描述](/images/49c416098fb92eedeeff93c2039a6252.jpeg)
这里默认编译的是64bit程序，如果你需要编译32位的程序，记得加上-m32参数，如果要调试的话，之前那个gdb也要改一下。。
![在这里插入图片描述](/images/6b64d5a236ca6856d7b6e21915fb655b.jpeg)
还有点要注意的是，launch里面配置的prelaunchtask里面填了“gcc.exe build active file”但是我们这个tasks.json里面填的label是“shell:gcc.exe build active file”，也会报错。
我们要保持这两个完全一致，就要把”shell:“去掉才行。
首先通过task里面的指令完成编译，之后使用launch里面的指令完成gdb调试。
之后如果是成功编译后的debug的话，调试的时候加断点什么的会成功。
![在这里插入图片描述](/images/e1b1048d9be4dc772a391fd1586d6103.jpeg)
