#!/bin/bash

# Quick Backup Script - Simple version
# Usage: ./quick-backup.sh

# Load .env if exists
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Parse DATABASE_URL or use defaults
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

# Create backups directory
mkdir -p backups

# Generate backup filename
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backups/fwc_backup_${DATE}.sql"

echo "🔄 Starting backup..."
echo "📊 Database: $DB_NAME"
echo "📁 Output: $BACKUP_FILE"

# Backup using pg_dump (SQL format for easy reading)
PGPASSWORD="$DB_PASSWORD" pg_dump \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --clean \
    --if-exists \
    --file="$BACKUP_FILE"

if [ $? -eq 0 ]; then
    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "✅ Backup completed successfully!"
    echo "📦 Size: $SIZE"
    echo "📁 File: $BACKUP_FILE"
    
    # Optional: Compress
    echo "🗜️  Compressing..."
    gzip "$BACKUP_FILE"
    COMPRESSED_SIZE=$(du -h "${BACKUP_FILE}.gz" | cut -f1)
    echo "✅ Compressed: $COMPRESSED_SIZE"
    echo "📁 Final file: ${BACKUP_FILE}.gz"
else
    echo "❌ Backup failed!"
    exit 1
fi

