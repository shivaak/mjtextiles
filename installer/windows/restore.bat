@echo off
setlocal enabledelayedexpansion

echo ============================================
echo   Database Restore
echo ============================================
echo.

REM Read .env file
if not exist ".env" (
    echo ERROR: .env file not found in current directory.
    pause
    exit /b 1
)

REM Parse .env for database credentials
for /f "usebackq tokens=1,* delims==" %%a in (".env") do (
    set "key=%%a"
    set "val=%%b"
    echo !key! | findstr /b "#" >nul 2>&1
    if errorlevel 1 (
        if "!key!"=="DB_URL" set "DB_URL=!val!"
        if "!key!"=="DB_USERNAME" set "DB_USERNAME=!val!"
        if "!key!"=="DB_PASSWORD" set "DB_PASSWORD=!val!"
        if "!key!"=="APP_BACKUP_DIRECTORY" set "BACKUP_DIR=!val!"
    )
)

REM Set defaults
if not defined BACKUP_DIR set "BACKUP_DIR=backups"

REM Parse JDBC URL
set "JDBC_URL=!DB_URL!"
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

REM Check if a backup file was provided as argument
if "%~1"=="" (
    echo Available backups:
    echo.
    set "count=0"
    for %%f in ("!BACKUP_DIR!\retailpos_*.sql.gz" "!BACKUP_DIR!\retailpos_*.sql") do (
        set /a count+=1
        echo   !count!. %%~nxf
        set "backup_!count!=%%f"
    )

    if !count! equ 0 (
        echo   No backups found in !BACKUP_DIR!
        echo.
        pause
        exit /b 1
    )

    echo.
    set /p "choice=Enter backup number to restore: "
    set "BACKUP_FILE=!backup_%choice%!"

    if not defined BACKUP_FILE (
        echo Invalid selection.
        pause
        exit /b 1
    )
) else (
    set "BACKUP_FILE=%~1"
)

if not exist "!BACKUP_FILE!" (
    echo ERROR: Backup file not found: !BACKUP_FILE!
    pause
    exit /b 1
)

echo.
echo WARNING: This will overwrite the current database '!DB_NAME!'.
echo Restoring from: !BACKUP_FILE!
echo.
set /p "confirm=Are you sure? (Y/N): "
if /i not "!confirm!"=="Y" (
    echo Restore cancelled.
    pause
    exit /b 0
)

set "PGPASSWORD=!DB_PASSWORD!"
set "TEMP_SQL=!BACKUP_DIR!\restore_temp.sql"

REM Check file extension and decompress if needed
echo !BACKUP_FILE! | findstr /i ".gz" >nul
if !errorlevel! equ 0 (
    echo Decompressing and restoring database...
    powershell -nologo -noprofile -command "$in=[System.IO.File]::OpenRead('!BACKUP_FILE!'); $gz=New-Object System.IO.Compression.GZipStream($in,[System.IO.Compression.CompressionMode]::Decompress); $out=[System.IO.File]::Create('!TEMP_SQL!'); $gz.CopyTo($out); $out.Close(); $gz.Close(); $in.Close()"
    psql -h !DB_HOST! -p !DB_PORT! -U !DB_USERNAME! -d !DB_NAME! -f "!TEMP_SQL!"
    del "!TEMP_SQL!" 2>nul
    goto :restore_done
)

REM Plain SQL file
echo Restoring database...
psql -h !DB_HOST! -p !DB_PORT! -U !DB_USERNAME! -d !DB_NAME! -f "!BACKUP_FILE!"

:restore_done
if !errorlevel! neq 0 (
    echo.
    echo ERROR: Restore failed.
    pause
    exit /b 1
)

echo.
echo Database restored successfully.
echo.
pause
