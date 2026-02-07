#!/bin/bash

echo "============================================"
echo "  Database Restore"
echo "============================================"
echo ""

# Read .env file
if [ ! -f .env ]; then
    echo "ERROR: .env file not found in current directory."
    exit 1
fi

# Source environment variables
set -a
while IFS='=' read -r key value; do
    [[ "$key" =~ ^#.*$ || -z "$key" ]] && continue
    key=$(echo "$key" | xargs)
    value=$(echo "$value" | xargs)
    export "$key=$value"
done < .env
set +a

# Set defaults
BACKUP_DIR="${APP_BACKUP_DIRECTORY:-backups}"

# Parse JDBC URL
JDBC_URL="${DB_URL#jdbc:postgresql://}"
HOST_PORT="${JDBC_URL%%/*}"
DB_NAME="${JDBC_URL#*/}"
DB_HOST="${HOST_PORT%%:*}"
DB_PORT="${HOST_PORT#*:}"
if [ "$DB_PORT" = "$DB_HOST" ]; then
    DB_PORT="5432"
fi

# Check if a backup file was provided
BACKUP_FILE="$1"

if [ -z "$BACKUP_FILE" ]; then
    echo "Available backups:"
    echo ""

    BACKUPS=()
    COUNT=0
    for f in "$BACKUP_DIR"/retailpos_*.sql.gz "$BACKUP_DIR"/retailpos_*.sql; do
        [ -f "$f" ] || continue
        COUNT=$((COUNT + 1))
        BACKUPS+=("$f")
        echo "  $COUNT. $(basename "$f")"
    done

    if [ $COUNT -eq 0 ]; then
        echo "  No backups found in $BACKUP_DIR"
        echo ""
        exit 1
    fi

    echo ""
    read -p "Enter backup number to restore: " CHOICE

    if [ -z "$CHOICE" ] || [ "$CHOICE" -lt 1 ] || [ "$CHOICE" -gt $COUNT ] 2>/dev/null; then
        echo "Invalid selection."
        exit 1
    fi

    BACKUP_FILE="${BACKUPS[$((CHOICE - 1))]}"
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "ERROR: Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo ""
echo "WARNING: This will overwrite the current database '$DB_NAME'."
echo "Restoring from: $BACKUP_FILE"
echo ""
read -p "Are you sure? (y/N): " CONFIRM

if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    echo "Restore cancelled."
    exit 0
fi

export PGPASSWORD="$DB_PASSWORD"

# Check file extension and decompress if needed
if [[ "$BACKUP_FILE" == *.gz ]]; then
    echo "Decompressing and restoring database..."
    gunzip -c "$BACKUP_FILE" | psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$DB_NAME" > /dev/null
else
    echo "Restoring database..."
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$DB_NAME" -f "$BACKUP_FILE" > /dev/null
fi

if [ $? -ne 0 ]; then
    echo ""
    echo "ERROR: Restore failed."
    exit 1
fi

echo ""
echo "Database restored successfully."
echo ""
