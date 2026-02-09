---
title: 用python模拟的MultiByteToWideChar然后WideCharToMultiByte出错情况
abbrlink: 64617
date: 2025-10-20 21:49:02
tags:
---

最近遇到一个CTF题。只有出错了才能够得到flag
原函数这样：

```c
int __cdecl sub_401D30(LPCCH lpMultiByteStr, int cbMultiByte, int *a3)
{
  int v3; // eax
  int v4; // ebx
  WCHAR *lpWideCharStr; // eax
  WCHAR *v6; // esi
  int v7; // eax
  CHAR *v8; // eax
  int cchWideChar; // [esp+14h] [ebp-28h]
  int v11; // [esp+28h] [ebp-14h]
  int v12; // [esp+28h] [ebp-14h]
  int v13; // [esp+2Ch] [ebp-10h]

  *a3 = 0;
  if ( lpMultiByteStr )
  {
    if ( cbMultiByte )
    {
      v3 = MultiByteToWideChar(0xFDE9u, 0, lpMultiByteStr, cbMultiByte, 0, 0);
      v4 = v3;
      if ( v3 )
      {
        lpWideCharStr = (WCHAR *)malloc(2 * v3);
        v6 = lpWideCharStr;
        if ( lpWideCharStr )
        {
          MultiByteToWideChar(0xFDE9u, 0, lpMultiByteStr, cbMultiByte, lpWideCharStr, v4);
          v7 = WideCharToMultiByte(0x4E4u, 0, v6, v4, 0, 0, 0, 0);
          if ( v7 )
          {
            v11 = v7;
            v8 = (CHAR *)malloc(v7);
            if ( v8 )
            {
              cchWideChar = v11;
              v13 = v11;
              v12 = (int)v8;
              WideCharToMultiByte(0x4E4u, 0, v6, v4, v8, cchWideChar, 0, 0);
              free(v6);
              *a3 = v12;
              return v13;
            }
          }
          free(v6);
        }
      }
    }
  }
  return 0;
}
```
逻辑先是0xFDE9u的MultiByteToWideChar也是cp65001 utf-8到0x4E4u的WideCharToMultiByte也就是cp1252。
其中utf-8遇到不认识的字符会转化为�（U+FFFD）然后转化为cp1252会变成\xFD,认识的宽字节字符也会取后面那个字节，如utf-8的 b'\xc2\x9d' U+009D 变成'\x9d'，utf-8的b'\xc3\xbd' U+00FD变成'\xFD'
用python模拟的时候废了很大的劲，主要是

> UnicodeEncodeError: 'charmap' codec can't encode character '\x9d' in
> position 0: character maps to <undefined>

U+009D 在cp1252里面识别不了
解决方法如下：
```python
# 原始字节序列
data = bytes([
    0x24, 0x59, 0x19, 0xC3, 0xBD, 0xC2, 0xB6, 0xC2, 0x9D, 0x27,
    0x43, 0x1D, 0xC3, 0xA8, 0xC2, 0xBE, 0xC5, 0xA0, 0x1D, 0x58,
    0x1D, 0xC3, 0x85, 0xC3, 0xBA, 0xC2, 0x8D, 0x7B, 0x56, 0x49,
    0xC2, 0xA9, 0xC2, 0xAC, 0xC3, 0x9D, 0x26, 0x50, 0x19, 0xC3,
    0xBE, 0xC2, 0xAF, 0xC5, 0xA0, 0x27, 0x53, 0x05
]

)  # C3 BD C2
def utf8_to_latin1_bytes(utf8_data: bytes) -> bytes:
    """
    将 UTF-8 编码的字节序列转换为 Latin1 单字节表示。
    
    原理：
    1. decode('utf-8') 将 UTF-8 解码为 Unicode 字符串
    2. encode('latin1') 将 Unicode 字符编码为单字节 Latin1
    """
    buffer=utf8_data.decode('utf-8',errors='replace')
    converted=b''
    for a in buffer:
        try:
            b=a.encode('cp1252', errors='surrogateescape')
            converted=converted+b
            print(converted)
        except UnicodeEncodeError:
            b=a.encode()
            converted=converted+b[-1:]
    return converted

# 测试示例



converted = utf8_to_latin1_bytes(data)

print("原始:", data.hex())
print("转换后:", converted.hex())


```
根据这个帖子：https://bugs.python.org/issue45120
https://github.com/python/cpython/issues/89283#issuecomment-1093928525

> WinAPI WideCharToMultiByte() uses a best-fit encoding unless the flag
> WC_NO_BEST_FIT_CHARS is passed.

用了bestfit1252算法：
https://www.unicode.org/Public/MAPPINGS/VENDORS/MICSFT/WindowsBestFit/bestfit1252.txt
也可以这样模拟：
```python
import codecs
# 原始字节序列
data = bytes([
    0x24, 0x59, 0x19, 0xC3, 0xBD, 0xC2, 0xB6, 0xC2, 0x9D, 0x27,
    0x43, 0x1D, 0xC3, 0xA8, 0xC2, 0xBE, 0xC5, 0xA0, 0x1D, 0x58,
    0x1D, 0xC3, 0x85, 0xC3, 0xBA, 0xC2, 0x8D, 0x7B, 0x56, 0x49,
    0xC2, 0xA9, 0xC2, 0xAC, 0xC3, 0x9D, 0x26, 0x50, 0x19, 0xC3,
    0xBE, 0xC2, 0xAF, 0xC5, 0xA0, 0x27, 0x53, 0x05
]

)  # C3 BD C2
def utf8_to_latin1_bytes(utf8_data: bytes) -> bytes:
    """
    将 UTF-8 编码的字节序列转换为 Latin1 单字节表示。
    
    原理：
    1. decode('utf-8') 将 UTF-8 解码为 Unicode 字符串
    2. codecs.code_page_encode 将unicode编码为cp1252字节
    """
    buffer=utf8_data.decode('utf-8',errors='replace')
    converted=codecs.code_page_encode(1252, buffer, 'replace')[0]

    return converted

# 测试示例

converted = utf8_to_latin1_bytes(data)

print("原始:", data.hex())
print("转换后:", converted.hex())

```

