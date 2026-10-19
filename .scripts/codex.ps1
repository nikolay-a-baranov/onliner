$ErrorActionPreference = "Stop"

$downloads = "C:\Users\KB\Downloads"
$project = "C:\Users\KB\Dev\onliner"
$target = Join-Path $project ".chatgpt"

New-Item -ItemType Directory -Path $target -Force | Out-Null

$file = Get-ChildItem -Path $downloads -File -Filter "chatgpt-codex-*.md" |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1

if ($file) {
    $destination = Join-Path $target $file.Name

    if (-not (Test-Path $destination)) {
        Move-Item -LiteralPath $file.FullName -Destination $destination
    }

    $artifact = Get-Item -LiteralPath $destination
} else {
    $artifact = Get-ChildItem -Path $target -File -Filter "chatgpt-codex-*.md" |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 1
}

if (-not $artifact) {
    Write-Host "Не найден chatgpt-codex-*.md."
    exit 1
}

$relativePath = ".chatgpt\$($artifact.Name)"
$message = "$relativePath"

Set-Clipboard -Value $message

$code = Get-Process -Name "Code" -ErrorAction SilentlyContinue |
    Where-Object { $_.MainWindowHandle -ne 0 } |
    Select-Object -First 1

if ($code) {
    $shell = New-Object -ComObject WScript.Shell
    $null = $shell.AppActivate($code.Id)
} else {
    Start-Process "code" -ArgumentList "`"$project`""
}

Write-Host "Артефакт:"
Write-Host $relativePath
Write-Host ""
Write-Host "Буфер:"
Write-Host $message