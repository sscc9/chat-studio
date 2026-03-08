@echo off
setlocal
cd /d "%~dp0"
echo Starting Chat Studio...

if not exist node_modules (
    echo [ERROR] node_modules folder not found!
    echo It looks like you haven't installed the dependencies yet.
    echo Please run "npm install" in this directory first.
    echo.
    pause
    exit /b
)

call npm run dev
pause
