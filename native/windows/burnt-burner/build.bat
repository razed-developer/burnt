@echo off
setlocal

where cl >nul 2>nul
if errorlevel 1 (
  echo [FAIL] MSVC cl.exe was not found. Run this from a Developer Command Prompt for Visual Studio.
  exit /b 1
)

set "SCRIPT_DIR=%~dp0"
set "OUTPUT_DIR=%SCRIPT_DIR%..\..\..\tools\bin"

if not exist "%OUTPUT_DIR%" mkdir "%OUTPUT_DIR%"

cl /nologo /std:c++17 /EHsc /W4 /DUNICODE /D_UNICODE "%SCRIPT_DIR%main.cpp" /Fe:"%OUTPUT_DIR%\burnt-burner.exe" ole32.lib oleaut32.lib shlwapi.lib
if errorlevel 1 exit /b 1

echo [OK] Built tools\bin\burnt-burner.exe
