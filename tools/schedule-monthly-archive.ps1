[CmdletBinding()]
param(
  [string]$TaskName = "Onliner Monthly Workspace Archive",
  [string]$Time = "10:00"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if ($Time -notmatch '^(?:[01]\d|2[0-3]):[0-5]\d$') { throw "Time must use 24-hour HH:mm format." }

$archiveScript = Join-Path $PSScriptRoot "archive-monthly.ps1"
$powerShell = Join-Path $PSHOME "powershell.exe"
$taskCommand = "`"$powerShell`" -NoProfile -ExecutionPolicy Bypass -File `"$archiveScript`" -Apply"

& schtasks.exe /Create /TN $TaskName /TR $taskCommand /SC MONTHLY /D 1 /ST $Time /F
if ($LASTEXITCODE -ne 0) { throw "Task Scheduler registration failed with exit code $LASTEXITCODE." }

if (Get-Command Get-ScheduledTask -ErrorAction SilentlyContinue) {
  $settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Hours 1)
  Set-ScheduledTask -TaskName $TaskName -Settings $settings | Out-Null
}

Write-Output "Scheduled '$TaskName' for day 1 of every month at $Time."
Write-Output "The task runs missed starts when the computer becomes available."
