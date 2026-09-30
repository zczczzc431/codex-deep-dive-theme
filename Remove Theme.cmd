@echo off
setlocal
node "%~dp0scripts\theme.mjs" remove
set "RC=%ERRORLEVEL%"
echo.
echo Theme action exit code: %RC%
pause
exit /b %RC%
