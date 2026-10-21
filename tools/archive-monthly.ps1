[CmdletBinding()]
param(
  [string]$SourceRoot = "",
  [string]$ArchiveRoot = "",
  [switch]$Apply
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Get-Sha256([string]$Path) {
  return (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant()
}

function Get-RelativePath([string]$BasePath, [string]$Path) {
  $base = [System.IO.Path]::GetFullPath($BasePath).TrimEnd('\') + '\'
  $target = [System.IO.Path]::GetFullPath($Path)
  $baseUri = [Uri]$base
  $targetUri = [Uri]$target
  return [Uri]::UnescapeDataString($baseUri.MakeRelativeUri($targetUri).ToString()).Replace('\', '/')
}

function Test-Month([string]$Value) {
  $parsed = [datetime]::MinValue
  return [datetime]::TryParseExact($Value, "yyyyMM", [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::None, [ref]$parsed)
}

function Get-SourceShape($Candidates) {
  return @(@(
    foreach ($candidate in $Candidates) {
      if (-not $candidate.directory) {
        "F|$($candidate.path)"
        continue
      }
      "D|$($candidate.path)"
      foreach ($item in Get-ChildItem -LiteralPath $candidate.source -Recurse -Force) {
        $kind = if ($item.PSIsContainer) { "D" } else { "F" }
        "$kind|$($candidate.path)/$(Get-RelativePath $candidate.source $item.FullName)"
      }
    }
  ) | Sort-Object -Unique)
}

$sourceBase = if ($SourceRoot) { $SourceRoot } else { Split-Path -Parent $PSScriptRoot }
$workspace = (Resolve-Path -LiteralPath $sourceBase).Path
$currentMonth = Get-Date -Format "yyyyMM"
$archiveBase = if ($ArchiveRoot) {
  [System.IO.Path]::GetFullPath($ArchiveRoot)
} else {
  Join-Path (Split-Path -Parent $workspace) "onliner-archive\$(Get-Date -Format 'yyyy-MM')"
}
$scopes = @(
  [pscustomobject]@{ source = ".chatgpt"; pattern = '^(?:chatgpt-codex|codex-chatgpt)-(?<date>20\d{6})-\d{6}\.(?:md|zip)$' },
  [pscustomobject]@{ source = ".handoff"; pattern = '^.+-(?<date>20\d{6})_\d{6}(?:\.zip)?$' },
  [pscustomobject]@{ source = ".audit"; pattern = '^.+-(?<date>20\d{6})_\d{6}\.txt$' }
)
$candidates = @(
  foreach ($scope in $scopes) {
    $scopePath = Join-Path $workspace $scope.source
    if (-not (Test-Path -LiteralPath $scopePath -PathType Container)) { continue }
    foreach ($item in Get-ChildItem -LiteralPath $scopePath -Force) {
      if ($item.PSIsContainer -and $item.Name -match '^20\d{4}$' -and (Test-Month $item.Name)) {
        if ($item.Name -ge $currentMonth) { continue }
        [pscustomobject]@{
          source = $item.FullName
          month = $item.Name
          path = "$($scope.source)/$($item.Name)"
          directory = $true
        }
        continue
      }
      $match = [regex]::Match($item.Name, $scope.pattern)
      if (-not $match.Success) { continue }
      $date = $match.Groups['date'].Value
      $parsed = [datetime]::MinValue
      if (-not [datetime]::TryParseExact($date, "yyyyMMdd", [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::None, [ref]$parsed)) { continue }
      $month = $date.Substring(0, 6)
      if ($month -ge $currentMonth) { continue }
      [pscustomobject]@{
        source = $item.FullName
        month = $month
        path = "$($scope.source)/$month/$($item.Name)"
        directory = [bool]$item.PSIsContainer
      }
    }
  }
)

if ($candidates.Count -eq 0) {
  Write-Output "No completed monthly artifacts found."
  exit 0
}

$candidates = @($candidates | Sort-Object month, path)
$firstMonth = $candidates[0].month
$lastMonth = $candidates[-1].month
$archiveName = "workspace-monthly-$firstMonth-$lastMonth"
$archivePath = Join-Path $archiveBase "$archiveName.zip"
$manifestPath = Join-Path $archiveBase "$archiveName-manifest.json"
$checksumPath = Join-Path $archiveBase "$archiveName.sha256"

Write-Output "Completed monthly artifacts: $($candidates.Count)"
$candidates | ForEach-Object { Write-Output "  $($_.path)" }
Write-Output "Archive: $archivePath"

if (-not $Apply) {
  Write-Output "Preview only. Run with -Apply to archive, verify, and remove these directories."
  exit 0
}

foreach ($path in @($archivePath, $manifestPath, $checksumPath)) {
  if (Test-Path -LiteralPath $path) { throw "Refusing to overwrite existing archive artifact: $path" }
}

$unsafe = @(
  foreach ($candidate in $candidates) {
    $sourceItem = Get-Item -LiteralPath $candidate.source -Force
    if ($sourceItem.Attributes -band [IO.FileAttributes]::ReparsePoint) { $sourceItem }
    if ($candidate.directory) {
      Get-ChildItem -LiteralPath $candidate.source -Recurse -Force | Where-Object { $_.Attributes -band [IO.FileAttributes]::ReparsePoint }
    }
  }
)
if ($unsafe.Count -gt 0) { throw "Refusing to archive reparse points: $($unsafe[0].FullName)" }

$directories = @(@(
  foreach ($candidate in $candidates) {
    if (-not $candidate.directory) { continue }
    $candidate.path
    foreach ($directory in Get-ChildItem -LiteralPath $candidate.source -Directory -Recurse -Force) {
      "$($candidate.path)/$(Get-RelativePath $candidate.source $directory.FullName)"
    }
  }
) | Sort-Object -Unique)
$files = @(@(
  foreach ($candidate in $candidates) {
    if (-not $candidate.directory) {
      $file = Get-Item -LiteralPath $candidate.source -Force
      [pscustomobject]@{
        source = $file.FullName
        path = $candidate.path
        bytes = [long]$file.Length
        sha256 = Get-Sha256 $file.FullName
      }
      continue
    }
    foreach ($file in Get-ChildItem -LiteralPath $candidate.source -File -Recurse -Force) {
      [pscustomobject]@{
        source = $file.FullName
        path = "$($candidate.path)/$(Get-RelativePath $candidate.source $file.FullName)"
        bytes = [long]$file.Length
        sha256 = Get-Sha256 $file.FullName
      }
    }
  }
) | Sort-Object path)
$duplicate = @($directories + @($files | ForEach-Object { $_.path }) | Group-Object | Where-Object Count -gt 1)
if ($duplicate.Count -gt 0) { throw "Archive path collision: $($duplicate[0].Name)" }
$sourceShape = Get-SourceShape $candidates
$totalBytes = [long]0
$files | ForEach-Object { $totalBytes += $_.bytes }
$manifest = [ordered]@{
  format = 1
  createdAtUtc = [datetime]::UtcNow.ToString("o")
  cutoffMonth = $currentMonth
  directories = @($directories)
  bytes = $totalBytes
  entries = @($files | Select-Object path, bytes, sha256)
}

$partialSuffix = ".partial-$PID"
$partialArchive = "$archivePath$partialSuffix"
$partialManifest = "$manifestPath$partialSuffix"
$partialChecksum = "$checksumPath$partialSuffix"
$partialPaths = @($partialArchive, $partialManifest, $partialChecksum)
$publishedPaths = [Collections.Generic.List[string]]::new()
$deletingSources = $false

try {
  New-Item -ItemType Directory -Path $archiveBase -Force | Out-Null
  $manifest | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $partialManifest -Encoding UTF8
  Add-Type -AssemblyName System.IO.Compression
  Add-Type -AssemblyName System.IO.Compression.FileSystem
  $archive = [IO.Compression.ZipFile]::Open($partialArchive, [IO.Compression.ZipArchiveMode]::Create)
  try {
  foreach ($directory in $directories) {
    $null = $archive.CreateEntry("$directory/")
  }
  foreach ($file in $files) {
    $entry = $archive.CreateEntry($file.path, [IO.Compression.CompressionLevel]::Optimal)
    $sourceStream = [IO.File]::OpenRead($file.source)
    $entryStream = $entry.Open()
    try { $sourceStream.CopyTo($entryStream) } finally { $entryStream.Dispose(); $sourceStream.Dispose() }
  }
  $manifestEntry = $archive.CreateEntry("manifest.json", [IO.Compression.CompressionLevel]::Optimal)
  $manifestSource = [IO.File]::OpenRead($partialManifest)
  $manifestTarget = $manifestEntry.Open()
  try { $manifestSource.CopyTo($manifestTarget) } finally { $manifestTarget.Dispose(); $manifestSource.Dispose() }
  } finally {
    $archive.Dispose()
  }

  $archive = [IO.Compression.ZipFile]::OpenRead($partialArchive)
  try {
  $entryMap = @{}
  foreach ($entry in $archive.Entries) { $entryMap[$entry.FullName.Replace('\', '/')] = $entry }
  if (-not $entryMap.ContainsKey("manifest.json")) { throw "Archive manifest is missing." }
  foreach ($file in $files) {
    $entry = $entryMap[$file.path]
    if ($null -eq $entry) { throw "Archive entry is missing: $($file.path)" }
    if ([long]$entry.Length -ne $file.bytes) { throw "Archive entry size mismatch: $($file.path)" }
    $entryStream = $entry.Open()
    try {
      $sha = [Security.Cryptography.SHA256]::Create()
      try { $hash = ([BitConverter]::ToString($sha.ComputeHash($entryStream))).Replace('-', '').ToLowerInvariant() } finally { $sha.Dispose() }
    } finally {
      $entryStream.Dispose()
    }
    if ($hash -ne $file.sha256) { throw "Archive entry hash mismatch: $($file.path)" }
  }
  } finally {
    $archive.Dispose()
  }

  $currentShape = Get-SourceShape $candidates
  if (@(Compare-Object $sourceShape $currentShape).Count -gt 0) { throw "Source layout changed during archiving." }
  foreach ($file in $files) {
    if (-not (Test-Path -LiteralPath $file.source -PathType Leaf)) { throw "Source changed during archiving: $($file.source)" }
    if ((Get-Item -LiteralPath $file.source).Length -ne $file.bytes) { throw "Source changed during archiving: $($file.source)" }
    if ((Get-Sha256 $file.source) -ne $file.sha256) { throw "Source changed during archiving: $($file.source)" }
  }

  $zipHash = Get-Sha256 $partialArchive
  Set-Content -LiteralPath $partialChecksum -Value "$zipHash  $([IO.Path]::GetFileName($archivePath))" -Encoding ASCII
  foreach ($move in @(
    [pscustomobject]@{ source = $partialArchive; target = $archivePath },
    [pscustomobject]@{ source = $partialManifest; target = $manifestPath },
    [pscustomobject]@{ source = $partialChecksum; target = $checksumPath }
  )) {
    Move-Item -LiteralPath $move.source -Destination $move.target
    $publishedPaths.Add($move.target)
  }
  $deletingSources = $true
  foreach ($candidate in $candidates) {
    Remove-Item -LiteralPath $candidate.source -Recurse -Force
  }
} catch {
  if (-not $deletingSources) {
    foreach ($path in $publishedPaths) {
      if (Test-Path -LiteralPath $path) { Remove-Item -LiteralPath $path -Force }
    }
  }
  throw
} finally {
  foreach ($path in $partialPaths) {
    if (Test-Path -LiteralPath $path) { Remove-Item -LiteralPath $path -Force }
  }
}

Write-Output "Archived and verified $($files.Count) files ($totalBytes bytes)."
Write-Output "SHA-256: $zipHash"
Write-Output "Removed $($candidates.Count) completed monthly artifacts."
