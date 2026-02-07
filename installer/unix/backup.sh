#!/bin/bash

echo "============================================"
echo "  Database Backup"
echo "============================================"
echo ""

# Read .env file
if [ ! -f .env ]; then
    echo "ERROR: .env file not found in current directory."
    exit 1
fi

# Source environment variables (skip comments and empty lines)
set -a
while IFS='=' read -r key value; do
    # Skip comments and empty lines
    [[ "$key" =~ ^#.*$ || -z "$key" ]] && continue
    # Remove leading/trailing whitespace
    key=$(echo "$key" | xargs)
    value=$(echo "$value" | xargs)
    export "$key=$value"
done < .env
set +a

# Set defaults
BACKUP_DIR="${APP_BACKUP_DIRECTORY:-backups}"
PG_DUMP_CMD="${APP_BACKUP_PG_DUMP_PATH:-pg_dump}"

# Parse JDBC URL: jdbc:postgresql://host:port/dbname
JDBC_URL="${DB_URL#jdbc:postgresql://}"
HOST_PORT="${JDBC_URL%%/*}"
DB_NAME="${JDBC_URL#*/}"
DB_HOST="${HOST_PORT%%:*}"
DB_PORT="${HOST_PORT#*:}"
# If no port was specified, HOST_PORT won't contain ':'
if [ "$DB_PORT" = "$DB_HOST" ]; then
    DB_PORT="5432"
fi

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Generate timestamp
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="$BACKUP_DIR/retailpos_${TIMESTAMP}.sql.gz"

echo "Backing up database '$DB_NAME' on $DB_HOST:$DB_PORT..."

# Run pg_dump with gzip compression
export PGPASSWORD="$DB_PASSWORD"
"$PG_DUMP_CMD" -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$DB_NAME" | gzip > "$BACKUP_FILE"

if [ ${PIPESTATUS[0]} -ne 0 ]; then
    echo ""
    echo "ERROR: Backup failed. Check that PostgreSQL is running and pg_dump is available."
    rm -f "$BACKUP_FILE"
    exit 1
fi

FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo ""
echo "Backup completed: $BACKUP_FILE ($FILE_SIZE)"
echo ""
