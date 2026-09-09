@echo off
setlocal
cd /d "%~dp0"

echo Creating a versioned marklee.au project archive...
echo.

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\export-project-context.ps1"

if errorlevel 1 (
    echo.
    echo Archive failed. Review the error above.
    pause
    exit /b 1
)

echo.
echo Archive complete. The ZIP path is shown above.
pause
