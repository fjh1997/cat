---
title: 如何从mssql里面导出程序集ASSEMBLY为dll
date: 2024-09-02 19:22:01
tags:
---

前段时间服务器被黑客入侵了，发现黑客注入的sql语句是创建了一个程序集ASSEMBLY

```sql
CREATE ASSEMBLY [SweetShellcodeclr35]AUTHORIZATION [dbo] FROM 0xFF……FFFFF  WITH PERMISSION_SET = UNSAFE;

```

，但是光凭sql语句无法逆向，之后在stackoverflow找到了一个方法导出程序集为dll文件的方法：
首先查出程序集的编号：

```sql
 select * from sys.assembly_files 
```
之后使用以下方法设置assembly_id 导出
```sql
DECLARE @IMG_PATH VARBINARY(MAX)
DECLARE @ObjectToken INT

SELECT @IMG_PATH = content FROM sys.assembly_files WHERE assembly_id = 65536

EXEC sp_OACreate 'ADODB.Stream', @ObjectToken OUTPUT
        EXEC sp_OASetProperty @ObjectToken, 'Type', 1
        EXEC sp_OAMethod @ObjectToken, 'Open'
        EXEC sp_OAMethod @ObjectToken, 'Write', NULL, @IMG_PATH
        EXEC sp_OAMethod @ObjectToken, 'SaveToFile', NULL, 'c:\temp\myassembly.dll', 2
        EXEC sp_OAMethod @ObjectToken, 'Close'
        EXEC sp_OADestroy @ObjectToken
```
有人问为什么我会去找这个方法，直接16进制转化为dll不就行了，原因是我之前用mysql转化的时候出错了。之后发现不能直接16进制转化为dll的原因是我是使用mysql转化的，而mysql里面`select 0x20 into outfile`和` select 0x20 into dumpfile`是不一样的，如果是outfile会重新编码，而dumpfile则不用。
所以其实直接去掉0x然后16进制转化也是可以的。

参考：https://stackoverflow.com/questions/4103406/extracting-a-net-assembly-from-sql-server-2005



