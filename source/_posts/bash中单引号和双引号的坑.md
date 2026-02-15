---
title: bash中单引号和双引号的坑
abbrlink: 38029
date: 2021-01-31 19:12:06
tags:
---



假如有以下环境

    a=apple      # 一个变量
    arr=(apple)  # 一个只有一个元素的数组

然后使用echo来打印第二列的表达式，然后会出现第三列的结果，原因是第四列

| #   | 表达式      | 结果     |原因                                                                      |
| --- | --------------- | ----------- | ----------------------------------------------------------------------------- |
| 1   | `"$a"`          | `apple`     | 在`""`之间的变量会被替换为变量的值，因为$表示一个变量                                            |
| 2   | `'$a'`          | `$a`        | 在`‘’`之间的变量不会被替换为变量的值                                        |
| 3   | `"'$a'"`        | `'apple'`   |  `""`中如果包含了`''` ，那么‘’会失去他的作用，没有任何意义，只是单纯的符号,但是变量依然会被替换成值。                                       |
| 4   | `'"$a"'`        | `"$a"`      | `''`中如果包含了`""` ，那么`""`会失去他的作用，没有任何意义，只是单纯的符号。                                                                        |
| 5   | `'\''`          | **invalid** | can not escape a `'` within `''`; use `"'"` or `$'\''` (ANSI-C quoting)       |
| 6   | `"red$arocks"`  | `red`       | `$arocks` does not expand `$a`; use `${a}rocks` to preserve `$a`              |
| 7   | `"redapple$"`   | `redapple$` | `$` followed by no variable name evaluates to `$`                             |
| 8   | `'\"'`          | `\"`        | `\` has no special meaning inside `''`                                        |
| 9   | `"\'"`          | `\'`        | shell程序认为，`\'` 在 `""` 之中没有意义所以不会被转义               |
| 10  | `"\""`          | `"`         | `\"` is interpreted inside `""`                                               |
| 11  | `"*"`           | `*`         | glob does not work inside `""` or `''`                                        |
| 12  | `"\t\n"`        | `\t\n`      | `\t` and `\n` have no special meaning inside `""` or `''`; use ANSI-C quoting |
| 13  | ``"`echo hi`"`` | `hi`        | ` `` ` and $() are evaluated inside `""` (backquotes are retained in actual output)                                     |
| 14  | ``'`echo hi`'`` | echo hi | ` `` ` and $() are not evaluated inside `''` (backquotes are retained in actual output)                                 |
| 15  | `'${arr[0]}'`   | `${arr[0]}` | array access not possible inside `''`                                         |
| 16  | `"${arr[0]}"`   | `apple`     | array access works inside `""`                                                |
| 17  | `$'$a\''`       | `$a'`       | single quotes can be escaped inside ANSI-C quoting                            |
| 18  | `"$'\t'"`       | `$'\t'`     | ANSI-C quoting is not interpreted inside `""`                                 |
| 19  | `'!cmd'`        | `!cmd`      | history expansion character `'!'` is ignored inside `''`                      |
| 20  | `"!cmd"`        | `cmd args`  | expands to the most recent command matching `"cmd"`                           |
| 21  | `$'!cmd'`       | `!cmd`      | history expansion character `'!'` is ignored inside ANSI-C quotes             |

----------
来源：https://stackoverflow.com/questions/6697753/difference-between-single-and-double-quotes-in-bash
