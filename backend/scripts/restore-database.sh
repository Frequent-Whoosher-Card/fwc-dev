#!/bin/bash

# Restore Script untuk PostgreSQL Database FWC
# File: backend/scripts/restore-database.sh
# Usage: ./restore-database.sh <backup_file.sql.gz>

# Load environment variables from .env file (if exists)
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Parse DATABASE_URL or use individual variables
if [ -n "$DATABASE_URL" ]; then
    # Remove query parameters (e.g., ?sslmode=disable)
    DB_URL_CLEAN=$(echo "$DATABASE_URL" | sed 's/?.*$//')
    
    # Parse PostgreSQL connection string
    DB_USER=$(echo "$DB_URL_CLEAN" | sed -n 's|postgresql://\([^:]*\):.*|\1|p')
    DB_PASSWORD_ENCODED=$(echo "$DB_URL_CLEAN" | sed -n 's|postgresql://[^:]*:\([^@]*\)@.*|\1|p')
    DB_HOST_PORT=$(echo "$DB_URL_CLEAN" | sed -n 's|postgresql://[^@]*@\([^/]*\)/.*|\1|p')
    DB_NAME_WITH_PARAMS=$(echo "$DB_URL_CLEAN" | sed -n 's|postgresql://[^/]*/\(.*\)|\1|p')
    DB_NAME=$(echo "$DB_NAME_WITH_PARAMS" | sed 's/?.*$//')
    
    # Extract host and port
    if echo "$DB_HOST_PORT" | grep -q ":"; then
        DB_HOST=$(echo "$DB_HOST_PORT" | cut -d':' -f1)
        DB_PORT=$(echo "$DB_HOST_PORT" | cut -d':' -f2)
    else
        DB_HOST="$DB_HOST_PORT"
        DB_PORT="5432"
    fi
    
    # Decode URL-encoded password
    if command -v python3 &> /dev/null; then
        DB_PASSWORD=$(python3 -c "import urllib.parse; print(urllib.parse.unquote('$DB_PASSWORD_ENCODED'))")
    elif command -v python &> /dev/null; then
        DB_PASSWORD=$(python -c "import urllib.parse; print(urllib.parse.unquote('$DB_PASSWORD_ENCODED'))")
    else
        # Fallback: basic sed decoding
        DB_PASSWORD=$(echo "$DB_PASSWORD_ENCODED" | sed 's/%23/#/g; s/%40/@/g; s/%3A/:/g; s/%2F/\//g; s/%3F/?/g; s/%25/%/g')
    fi
else
    DB_HOST="${DB_HOST:-localhost}"
    DB_PORT="${DB_PORT:-5432}"
    DB_NAME="${DB_NAME:-fwc}"
    DB_USER="${DB_USER:-postgres}"
    DB_PASSWORD="${DB_PASSWORD:-}"
fi

# Check if backup file is provided
if [ -z "$1" ]; then
    echo "Usage: $0 <backup_file.sql.gz>"
    echo "Example: $0 backups/fwc_backup_20250101_120000.sql.gz"
    exit 1
fi

BACKUP_FILE="$1"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo "ERROR: Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "=== Starting FWC Database Restore ==="
echo "Database: $DB_NAME"
echo "Host: $DB_HOST:$DB_PORT"
echo "User: $DB_USER"
echo "Backup file: $BACKUP_FILE"
echo ""
read -p "⚠️  WARNING: This will replace all data in database $DB_NAME. Continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Restore cancelled."
    exit 0
fi

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "ERROR: psql command not found. Please install PostgreSQL client tools."
    exit 1
fi

# Determine if file is compressed and prepare for restore
if [[ "$BACKUP_FILE" == *.gz ]]; then
    echo "Decompressing backup file..."
    TEMP_FILE="${BACKUP_FILE%.gz}"
    gunzip -c "$BACKUP_FILE" > "$TEMP_FILE"
    RESTORE_FILE="$TEMP_FILE"
else
    RESTORE_FILE="$BACKUP_FILE"
fi

# Restore database using psql (for SQL format)
echo "Restoring database from SQL file..."
PGPASSWORD="${DB_PASSWORD}" psql \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    -f "$RESTORE_FILE" \
    --echo-all \
    --set ON_ERROR_STOP=on

if [ $? -eq 0 ]; then
    echo "✅ Database restore completed successfully"
    
    # Cleanup temp file if it was compressed
    if [[ "$BACKUP_FILE" == *.gz ]]; then
        rm "$TEMP_FILE"
    fi
else
    echo "❌ ERROR: Database restore failed"
    # Cleanup temp file if it was compressed
    if [[ "$BACKUP_FILE" == *.gz ]]; then
        rm -f "$TEMP_FILE"
    fi
    exit 1
fi

echo "=== Restore process finished ==="

