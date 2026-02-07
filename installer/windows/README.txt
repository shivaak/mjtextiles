Quick Start Guide (Windows)
============================

Prerequisites:
   - Java 21 or later (download from https://adoptium.net/)
   - PostgreSQL installed and running

Starting the Application:
   1. Double-click "start.bat" to start the application
   2. The app will open in your browser automatically
   3. Login with your username and password

Stopping the Application:
   - Close the black command window, OR
   - Double-click "stop.bat"

Database Backup:
   - Automatic backups run daily at midnight (configurable in .env)
   - To take a manual backup: double-click "backup.bat"
   - Backups are saved in the "backups" folder

Database Restore:
   - Double-click "restore.bat"
   - Pick a backup from the list, or run: restore.bat backups\filename.sql.gz
   - WARNING: Restoring will overwrite the current database

Configuration (.env file):
   - DB_URL             : PostgreSQL connection URL
   - DB_USERNAME        : Database username
   - DB_PASSWORD        : Database password
   - JWT_SECRET         : Security key (don't change after first setup)
   - APP_BACKUP_CRON    : Backup schedule (default: daily at midnight)
   - APP_BACKUP_RETENTION_COUNT : Number of backups to keep (default: 7)
   - APP_BACKUP_DIRECTORY       : Backup folder (default: backups)
   - APP_BACKUP_PG_DUMP_PATH   : Path to pg_dump.exe (if not on PATH)

If you see "Java is not installed":
   - Download Java from: https://adoptium.net/
   - Install it (just click Next through the installer)
   - Then try start.bat again

Logs:
   - Application logs are saved in the "logs" folder
   - If something goes wrong, zip the "logs" folder and send it for support

Troubleshooting:
   - Make sure PostgreSQL is running
   - Make sure no other program is using port 8080
   - Check the "logs" folder for error details
