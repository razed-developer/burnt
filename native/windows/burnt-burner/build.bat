@echo off
setlocal
where cl >nul 2>nul
if errorlevel 1 (
  echo [FAIL] MSVC cl.exe was not found. Run this from a Developer Command Prompt for Visual Studio.
  exit /b 1
)
if not exist "..\..\..\tools\bin" mkdir "..\..\..\tools\bin"
cl /nologo /std:c++17 /EHsc /W4 /DUNICODE /D_UNICODE main.cpp /Fe:"..\..\..\tools\bin\burnt-burner.exe" ole32.lib oleaut32.lib shlwapi.lib
if errorlevel 1 exit /b 1
echo [OK] Built tools\bin\burnt-burner.exe
