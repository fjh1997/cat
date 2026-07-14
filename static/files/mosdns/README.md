# mosdns-x Windows helper scripts

Companion files for the post:
[使用mosdns-x实现DNS分流](https://cat.fjh1997.top/posts/2026070601.html)

| File | Purpose |
|------|---------|
| `healthcheck.ps1` | Probe UDP default path via `127.0.0.1`; restart `mosdns` only on failure |
| `install-healthcheck.ps1` | Copy healthcheck to `C:\mosdns` and register task `mosdns-udp-health` (run as Admin) |
| `config.windows.yaml` | Sample Windows config (UDP default + DoH whitelist via SOCKS5) |
| `whitelist.txt` | Sample domain whitelist |

## Quick install healthcheck

```powershell
# Download into C:\mosdns then:
Set-Location C:\mosdns
# (place healthcheck.ps1 and install-healthcheck.ps1 here)
powershell -ExecutionPolicy Bypass -File .\install-healthcheck.ps1
```

Or with remote files after site deploy:

```powershell
New-Item -ItemType Directory -Path C:\mosdns -Force | Out-Null
Invoke-WebRequest https://cat.fjh1997.top/files/mosdns/healthcheck.ps1 -OutFile C:\mosdns\healthcheck.ps1
Invoke-WebRequest https://cat.fjh1997.top/files/mosdns/install-healthcheck.ps1 -OutFile C:\mosdns\install-healthcheck.ps1
powershell -ExecutionPolicy Bypass -File C:\mosdns\install-healthcheck.ps1
```
