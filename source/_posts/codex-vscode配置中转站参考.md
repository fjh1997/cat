---
title: windows上codex插件+vscode配置中转站API参考以及中文乱码还有自动同意策略、管理员权限的解决方案
abbrlink: 18834
date: 2026-03-02 16:54:20
tags:
---
可以先配置好CLIProxyAPI，代理是在内部proxy-url可以设置  
然后在%USERPROFILE%/.codex/config.toml中参考以下配置： 
```toml
model_provider = "fox"
model = "gpt-5.3-codex"
model_reasoning_effort = "high"
features.powershell_utf8 = true
approval_policy = "never"
sandbox_mode = "danger-full-access"
[windows]
sandbox = "elevated"

[model_providers.fox]
name = "fox"
base_url = "http://192.168.1.5:8317/v1"
wire_api = "responses"
requires_openai_auth = true
[features]
powershell_utf8 = false

[mcp_servers.ida-pro-mcp]
command = "C:\\Users\\54930\\AppData\\Local\\Programs\\Python\\Python314\\python.exe"
args = [
    "C:\\Users\\54930\\AppData\\Local\\Programs\\Python\\Python314\\Lib\\site-packages\\ida_pro_mcp\\server.py",
    "--ida-rpc",
    "http://127.0.0.1:13337",
]
[mcp_servers.jadx_mcp_server]
command = "C:\\Users\\54930\\.local\\bin\\uv.exe"
args = [
    "--directory",
    "G:\\\u4E0B\u8F7D\\jadx-mcp-server-v6.1.0\\jadx-mcp-server",
    "run",
    "jadx_mcp_server.py"
]
env = { PYTHONUTF8 = "1" }
enabled = true

```

还有%USERPROFILE%/.codex/auth.json
```json
{
  "OPENAI_API_KEY":"your-api-key-1"
}
```
注意如果有中文路径可能会导致stdio方式我i收的mcp握手失败`MCP startup failed: handshaking ... connection closed: initialize response`
需要加上`env = { PYTHONUTF8 = "1" }`参数，不然会导致中文编码乱码问题。   
还需要在提示词里面加上，每次使用powershell之前要$PSDefaultParameterValues['Get-Content:Encoding'] = 'UTF8'，不然Get-Content也可能会乱码。
也可以在powershell的profile里面配置：
```
code $PROFILE
$PSDefaultParameterValues['Get-Content:Encoding'] = 'utf8'
 ```
加了approval_policy = "never"之后可以避免烦人的同意按钮。  
```
sandbox_mode = "danger-full-access"  
[windows]
sandbox = "elevated"
```

加上可以让codex用管理员身份启动
```
[features]
powershell_utf8 = false
```
这一行最好也加上不然容易乱码

测试脚本如下：
```python
import tomllib, pathlib, subprocess, time
cfg = pathlib.Path(r'C:\Users\54930\.codex\config.toml')
d = tomllib.loads(cfg.read_text(encoding='utf-8'))
j = d['mcp_servers']['jadx_mcp_server']
cmd = [j['command'], *j['args']]
p = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
try:
    time.sleep(1.0)
    chunk = p.stderr.peek(256)[:256]
    print('stderr_chunk_len=', len(chunk))
    try:
        chunk.decode('utf-8','strict')
        print('stderr_utf8_strict=OK')
    except Exception as e:
        print('stderr_utf8_strict=FAIL', type(e).__name__, str(e))
finally:
    p.terminate()
    try: p.wait(timeout=2)
    except: pass
```
另外Codex的历史记录会在C:\Users\54930\.codex\sessions\2026\03\02\*.jsonl这个里面
