@echo off
title Retail POS

REM Check if Java is installed
java -version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo Java is not installed.
    echo Please install Java 21 from https://adoptium.net/
    echo.
    pause
    exit /b 1
)

REM Check if already running on port 8080
netstat -ano | findstr :8080 | findstr LISTENING >nul 2>&1
if %errorlevel% equ 0 (
    echo.
    echo Application is already running.
    echo Open your browser and go to http://localhost:8080
    echo.
    pause
    exit /b 0
)

REM Start the application
echo Starting application...
start /b javaw -jar retailpos.jar
timeout /t 4 /nobreak >nul
start http://localhost:8080

echo.
echo ============================================
echo   Application is running
echo   Open http://localhost:8080 in your browser
echo ============================================
echo.
echo Press any key to stop the server...
pause >nul
taskkill /f /im javaw.exe >nul 2>&1
echo Application has been stopped.
