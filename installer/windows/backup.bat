@echo off
setlocal enabledelayedexpansion

echo ============================================
echo   Database Backup
echo ============================================
echo.

REM Read .env file
if not exist .env (
    echo ERROR: .env file not found in current directory.
    pause
    exit /b 1
)

REM Parse .env for database credentials
for /f "usebackq tokens=1,* delims==" %%a in (".env") do (
    set "key=%%a"
    set "val=%%b"
    REM Skip comment lines
    echo !key! | findstr /b "#" >nul 2>&1
    if errorlevel 1 (
        if "!key!"=="DB_URL" set "DB_URL=!val!"
        if "!key!"=="DB_USERNAME" set "DB_USERNAME=!val!"
        if "!key!"=="DB_PASSWORD" set "DB_PASSWORD=!val!"
        if "!key!"=="APP_BACKUP_PG_DUMP_PATH" set "PG_DUMP_PATH=!val!"
        if "!key!"=="APP_BACKUP_DIRECTORY" set "BACKUP_DIR=!val!"
    )
)

REM Set defaults
if not defined BACKUP_DIR set "BACKUP_DIR=backups"
if not defined PG_DUMP_PATH set "PG_DUMP_PATH=pg_dump"

REM Parse JDBC URL: jdbc:postgresql://host:port/dbname
set "JDBC_URL=%DB_URL%"
set "JDBC_URL=!JDBC_URL:jdbc:postgresql://=!"
for /f "tokens=1,2 delims=/" %%a in ("!JDBC_URL!") do (
    set "HOST_PORT=%%a"
    set "DB_NAME=%%b"
)
for /f "tokens=1,2 delims=:" %%a in ("!HOST_PORT!") do (
    set "DB_HOST=%%a"
    set "DB_PORT=%%b"
)
if not defined DB_PORT set "DB_PORT=5432"

REM Create backup directory
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

REM Generate timestamp
for /f "tokens=1-6 delims=/:. " %%a in ("%date% %time%") do (
    set "TIMESTAMP=%%a-%%b-%%c_%%d-%%e-%%f"
)

REM Use a simpler timestamp format
for /f %%i in ('powershell -nologo -noprofile -command "Get-Date -Format 'yyyy-MM-dd_HH-mm-ss'"') do set "TIMESTAMP=%%i"

set "BACKUP_FILE=%BACKUP_DIR%\retailpos_%TIMESTAMP%.sql"

echo Backing up database '%DB_NAME%' on %DB_HOST%:%DB_PORT%...

REM Run pg_dump
set "PGPASSWORD=%DB_PASSWORD%"
"%PG_DUMP_PATH%" -h %DB_HOST% -p %DB_PORT% -U %DB_USERNAME% -d %DB_NAME% -f "%BACKUP_FILE%"

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Backup failed. Check that PostgreSQL is running and pg_dump is available.
    pause
    exit /b 1
)

REM Compress with PowerShell (gzip equivalent on Windows)
echo Compressing backup...
powershell -nologo -noprofile -command "Compress-Archive -Path '%BACKUP_FILE%' -DestinationPath '%BACKUP_FILE%.zip' -Force"
if exist "%BACKUP_FILE%.zip" (
    del "%BACKUP_FILE%"
    echo.
    echo Backup completed: %BACKUP_FILE%.zip
) else (
    echo.
    echo Backup completed (uncompressed): %BACKUP_FILE%
)

echo.
pause
