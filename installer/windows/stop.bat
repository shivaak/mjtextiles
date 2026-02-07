@echo off
setlocal enabledelayedexpansion

if not exist ".app.pid" (
    echo Application is not running ^(no PID file found^).
    pause
    exit /b 0
)

set /p APP_PID=<".app.pid"

REM Check if the process is still running
tasklist /FI "PID eq !APP_PID!" 2>nul | findstr /i "java" >nul 2>&1
if !errorlevel! neq 0 (
    echo Application was not running ^(stale PID file^).
    del ".app.pid" >nul 2>&1
    pause
    exit /b 0
)

taskkill /F /PID !APP_PID! >nul 2>&1
del ".app.pid" >nul 2>&1
echo Application stopped ^(PID: !APP_PID!^).
pause
