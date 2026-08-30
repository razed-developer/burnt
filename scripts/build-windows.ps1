$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host '== Burnt Windows release build ==' -ForegroundColor Cyan

$required = @('tools/bin/ffmpeg.exe', 'tools/bin/ffprobe.exe')
foreach ($path in $required) {
  if (-not (Test-Path $path)) { throw "Missing required bundled tool: $path" }
}

function Import-MsvcEnvironment {
  if (Get-Command cl.exe -ErrorAction SilentlyContinue) { return }

  $vswhere = Join-Path ${env:ProgramFiles(x86)} 'Microsoft Visual Studio/Installer/vswhere.exe'
  if (-not (Test-Path $vswhere)) {
    throw 'MSVC cl.exe is not on PATH and vswhere.exe was not found. Install Visual Studio Build Tools with Desktop development with C++.'
  }

  $installation = & $vswhere -latest -products * -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath
  if (-not $installation) {
    throw 'Visual Studio C++ build tools were not found. Install the Desktop development with C++ workload.'
  }

  $devCmd = Join-Path $installation 'Common7/Tools/VsDevCmd.bat'
  if (-not (Test-Path $devCmd)) { throw "VsDevCmd.bat was not found under $installation" }

  Write-Host '      Loading Visual Studio C++ build environment...'
  $environment = cmd.exe /s /c "`"$devCmd`" -no_logo -arch=x64 -host_arch=x64 && set"
  if ($LASTEXITCODE -ne 0) { throw 'Could not initialize the Visual Studio C++ build environment.' }

  foreach ($line in $environment) {
    if ($line -match '^([^=]+)=(.*)$') { Set-Item -Path "Env:$($matches[1])" -Value $matches[2] }
  }

  if (-not (Get-Command cl.exe -ErrorAction SilentlyContinue)) { throw 'Visual Studio environment loaded, but cl.exe is still unavailable.' }
}

Write-Host '[1/4] Building native Audio CD helper...'
Import-MsvcEnvironment
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
