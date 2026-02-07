@echo off
setlocal enabledelayedexpansion

REM Check if Java is installed
java -version >nul 2>&1
if !errorlevel! neq 0 (
    echo.
    echo Java is not installed.
    echo Please install Java 21 from https://adoptium.net/
    echo.
    pause
    exit /b 1
)

REM Check if already running via PID file
if exist ".app.pid" (
    set /p OLD_PID=<".app.pid"
    tasklist /FI "PID eq !OLD_PID!" 2>nul | findstr /i "java" >nul 2>&1
    if !errorlevel! equ 0 (
        echo.
        echo Application is already running ^(PID: !OLD_PID!^).
        echo Open your browser and go to http://localhost:8080
        echo.
        exit /b 0
    ) else (
        del ".app.pid" >nul 2>&1
    )
)

REM Start the application and capture PID
echo Starting application...
for /f %%i in ('powershell -nologo -noprofile -command "Start-Process java -ArgumentList '-jar','retailpos.jar' -WindowStyle Hidden -PassThru | Select-Object -ExpandProperty Id"') do set APP_PID=%%i

echo !APP_PID! > ".app.pid"
timeout /t 4 /nobreak >nul
start http://localhost:8080

echo.
echo ============================================
echo   Application is running ^(PID: !APP_PID!^)
echo   Open http://localhost:8080 in your browser
echo ============================================
echo.
echo To stop: run stop.bat
