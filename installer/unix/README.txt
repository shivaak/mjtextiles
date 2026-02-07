Quick Start Guide (macOS / Linux)
===================================

Prerequisites:
   - Java 21 or later
       macOS:  brew install openjdk@21
       Linux:  sudo apt install openjdk-21-jdk
   - PostgreSQL installed and running

Starting the Application:
   1. Open a terminal in this folder
   2. Run: ./start.sh
   3. The app will open in your browser automatically
   4. Login with your username and password

Stopping the Application:
   - Run: ./stop.sh

Database Backup:
   - Automatic backups run daily at midnight (configurable in .env)
   - To take a manual backup: ./backup.sh
   - Backups are saved in the "backups" folder

Database Restore:
   - Run: ./restore.sh
   - Pick a backup from the list, or run: ./restore.sh backups/filename.sql.gz
   - WARNING: Restoring will overwrite the current database

Configuration (.env file):
   - DB_URL             : PostgreSQL connection URL
   - DB_USERNAME        : Database username
   - DB_PASSWORD        : Database password
   - JWT_SECRET         : Security key (don't change after first setup)
   - APP_BACKUP_CRON    : Backup schedule (default: daily at midnight)
   - APP_BACKUP_RETENTION_COUNT : Number of backups to keep (default: 7)
   - APP_BACKUP_DIRECTORY       : Backup folder (default: backups)
   - APP_BACKUP_PG_DUMP_PATH   : Path to pg_dump (if not on PATH)

Making scripts executable (first time only):
   chmod +x start.sh stop.sh backup.sh restore.sh

Logs:
   - Application logs are saved in the "logs" folder
   - If something goes wrong, zip the "logs" folder and send it for support

Troubleshooting:
   - Make sure PostgreSQL is running
   - Make sure no other program is using port 8080
   - Check the "logs" folder for error details
