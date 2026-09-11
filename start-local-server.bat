@echo off
setlocal
cd /d "%~dp0"
start "marklee.au local server" powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-local-server.ps1"
exit /b 0
