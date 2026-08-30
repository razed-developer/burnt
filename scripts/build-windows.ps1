$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host '== Burnt Windows release build ==' -ForegroundColor Cyan

$required = @(
  'tools/bin/ffmpeg.exe',
  'tools/bin/ffprobe.exe'
)
foreach ($path in $required) {
  if (-not (Test-Path $path)) { throw "Missing required bundled tool: $path" }
}

Write-Host '[1/4] Building native Audio CD helper...'
& "$root/native/windows/burnt-burner/build.bat"
if ($LASTEXITCODE -ne 0) { throw 'Native burner helper build failed.' }
if (-not (Test-Path 'tools/bin/burnt-burner.exe')) { throw 'burnt-burner.exe was not produced in tools/bin.' }

Write-Host '[2/4] Building Tauri application and NSIS installer...'
npm run tauri build
if ($LASTEXITCODE -ne 0) { throw 'Tauri release build failed.' }

$release = Join-Path $root 'src-tauri/target/release'
$appExe = Join-Path $release 'burnt.exe'
if (-not (Test-Path $appExe)) { throw "Release executable not found: $appExe" }

Write-Host '[3/4] Creating portable folder...'
$portable = Join-Path $root 'release/Burnt-portable'
if (Test-Path $portable) { Remove-Item $portable -Recurse -Force }
New-Item -ItemType Directory -Force -Path (Join-Path $portable 'tools/bin') | Out-Null
Copy-Item $appExe (Join-Path $portable 'Burnt.exe')
Copy-Item 'tools/bin/ffmpeg.exe' (Join-Path $portable 'tools/bin/ffmpeg.exe')
Copy-Item 'tools/bin/ffprobe.exe' (Join-Path $portable 'tools/bin/ffprobe.exe')
Copy-Item 'tools/bin/burnt-burner.exe' (Join-Path $portable 'tools/bin/burnt-burner.exe')

Write-Host '[4/4] Done.' -ForegroundColor Green
Write-Host "Portable: $portable"
Write-Host "Installer directory: $(Join-Path $release 'bundle/nsis')"
Write-Host ''
Write-Host 'Next verification: run release/Burnt-portable/Burnt.exe directly, confirm disc detection and audio-file probing, then perform one packaged-build burn.'
