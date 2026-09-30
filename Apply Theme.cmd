@echo off
setlocal
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 22 or newer is required. Install it and reopen this script.
  pause
  exit /b 1
)
node "%~dp0scripts\theme.mjs" apply
set "RC=%ERRORLEVEL%"
echo.
echo Theme action exit code: %RC%
pause
exit /b %RC%
