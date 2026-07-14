# mosdns UDP upstream health check
# Probe non-whitelist name via 127.0.0.1; restart service only on failure.
# Intended to run as SYSTEM scheduled task every few minutes.
$ErrorActionPreference = 'Continue'
$logFile = 'C:\mosdns\healthcheck.log'

function Log($m) {
  $line = "{0} {1}" -f (Get-Date -Format 'o'), $m
  Add-Content -Path $logFile -Value $line -Encoding UTF8
}

$ok = $false
try {
  $r = Resolve-DnsName -Name 'www.baidu.com' -Server 127.0.0.1 -DnsOnly -Type A -ErrorAction Stop
  if ($r | Where-Object { $_.IPAddress }) { $ok = $true }
} catch {
  Log "probe FAIL: $_"
}

if ($ok) { exit 0 }

Log 'UDP path dead -> Restart-Service mosdns'
try {
  Restart-Service mosdns -Force -ErrorAction Stop
  Start-Sleep -Seconds 3
  $r2 = Resolve-DnsName -Name 'www.baidu.com' -Server 127.0.0.1 -DnsOnly -Type A -ErrorAction Stop
  $ips = ($r2 | Where-Object IPAddress | Select-Object -First 2).IPAddress -join ','
  Log "after restart OK: $ips"
  exit 0
} catch {
  Log "after restart still FAIL: $_"
  exit 1
}
