$project = "C:\Users\KB\Dev\onliner"
$downloads = "C:\Users\KB\Downloads"

$archive = Get-ChildItem $downloads -Filter *.zip -File |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1

if (-not $archive) {
    Write-Host "ZIP not found."
    exit 1
}

if (-not (Test-Path (Join-Path $project ".git"))) {
    Write-Host "Project root is invalid: $project"
    exit 1
}

Add-Type -AssemblyName System.IO.Compression.FileSystem

$zip = [System.IO.Compression.ZipFile]::OpenRead($archive.FullName)

try {
    foreach ($entry in $zip.Entries) {
        $path = $entry.FullName.Replace("/", "\")

        if (
            [System.IO.Path]::IsPathRooted($path) -or
            $path -match '(^|\\)\.\.(\\|$)'
        ) {
            throw "Unsafe archive path: $path"
        }
    }
}
finally {
    $zip.Dispose()
}

Write-Host "Patch:"
Write-Host $archive.FullName
Write-Host ""

Expand-Archive `
    -Path $archive.FullName `
    -DestinationPath $project `
    -Force

Write-Host "Applied to:"
Write-Host $project
Write-Host ""

Set-Location $project
git status --short