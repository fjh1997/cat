# Register mosdns UDP health-check scheduled task (run as Administrator)
# Usage:
#   powershell -ExecutionPolicy Bypass -File .\install-healthcheck.ps1
$ErrorActionPreference = 'Stop'

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
  [Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
  Write-Host 'Please run this script in an elevated (Administrator) PowerShell.' -ForegroundColor Red
  exit 1
}

$src = $PSScriptRoot
$dstDir = 'C:\mosdns'
$dstScript = Join-Path $dstDir 'healthcheck.ps1'

if (-not (Test-Path $dstDir)) {
  New-Item -ItemType Directory -Path $dstDir -Force | Out-Null
}

$localHealth = Join-Path $src 'healthcheck.ps1'
if (Test-Path $localHealth) {
  Copy-Item -LiteralPath $localHealth -Destination $dstScript -Force
} elseif (-not (Test-Path $dstScript)) {
  Write-Host "healthcheck.ps1 not found next to this installer, and $dstScript missing." -ForegroundColor Red
  exit 1
}

Write-Host "Installed: $dstScript"

Unregister-ScheduledTask -TaskName 'mosdns-udp-health' -Confirm:$false -ErrorAction SilentlyContinue

$action = New-ScheduledTaskAction -Execute 'powershell.exe' `
  -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$dstScript`""
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).Date `
  -RepetitionInterval (New-TimeSpan -Minutes 3) `
  -RepetitionDuration (New-TimeSpan -Days 3650)
$principal = New-ScheduledTaskPrincipal -UserId 'SYSTEM' -LogonType ServiceAccount -RunLevel Highest
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
  -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Minutes 2)

Register-ScheduledTask -TaskName 'mosdns-udp-health' -Action $action -Trigger $trigger `
  -Principal $principal -Settings $settings -Force | Out-Null

Write-Host 'Registered scheduled task: mosdns-udp-health (every 3 minutes, SYSTEM)'
Start-ScheduledTask -TaskName 'mosdns-udp-health'
Start-Sleep -Seconds 3

try {
  $r = Resolve-DnsName www.baidu.com -Server 127.0.0.1 -DnsOnly -Type A -ErrorAction Stop
  $ips = ($r | Where-Object IPAddress | Select-Object -First 2).IPAddress -join ', '
  Write-Host "Probe via 127.0.0.1: OK ($ips)" -ForegroundColor Green
} catch {
  Write-Host "Probe via 127.0.0.1: FAIL ($_)" -ForegroundColor Yellow
  Write-Host 'If mosdns is not installed yet, install the service first, then re-run this installer.'
}

Get-ScheduledTask -TaskName 'mosdns-udp-health' | Format-List TaskName, State
