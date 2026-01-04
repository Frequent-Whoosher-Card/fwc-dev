#!/bin/bash

# Backup Script untuk PostgreSQL Database FWC
# File: backend/scripts/backup-database.sh

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

# Backup settings
BACKUP_DIR="${BACKUP_DIR:-./backups}"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="fwc_backup_${DATE}"
RETENTION_DAYS=7

# Logging
LOG_FILE="${LOG_FILE:-./backups/backup.log}"

# Function untuk logging
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Create backup directory if not exists
mkdir -p "$BACKUP_DIR"

log_message "=== Starting FWC Database Backup ==="
log_message "Database: $DB_NAME"
log_message "Host: $DB_HOST:$DB_PORT"
log_message "User: $DB_USER"

# Check if pg_dump is available
if ! command -v pg_dump &> /dev/null; then
    log_message "ERROR: pg_dump command not found. Please install PostgreSQL client tools."
    exit 1
fi

# 1. Backup PostgreSQL Database (SQL format - plain text)
log_message "Backing up PostgreSQL database..."

PGPASSWORD="${DB_PASSWORD}" pg_dump \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --clean \
    --if-exists \
    --file="$BACKUP_DIR/${BACKUP_NAME}.sql" \
    --verbose

if [ $? -eq 0 ]; then
    log_message "✅ Database backup completed successfully"
    
    # Get backup size
    BACKUP_SIZE=$(du -h "$BACKUP_DIR/${BACKUP_NAME}.sql" | cut -f1)
    log_message "📦 Backup size: $BACKUP_SIZE"
    log_message "📁 Backup file: $BACKUP_DIR/${BACKUP_NAME}.sql"
    
    # Optional: Create compressed version
    log_message "Creating compressed backup..."
    gzip -c "$BACKUP_DIR/${BACKUP_NAME}.sql" > "$BACKUP_DIR/${BACKUP_NAME}.sql.gz"
    
    if [ $? -eq 0 ]; then
        COMPRESSED_SIZE=$(du -h "$BACKUP_DIR/${BACKUP_NAME}.sql.gz" | cut -f1)
        log_message "✅ Compressed backup created: $COMPRESSED_SIZE"
        # Remove uncompressed file to save space
        rm "$BACKUP_DIR/${BACKUP_NAME}.sql"
        log_message "📦 Final backup file: $BACKUP_DIR/${BACKUP_NAME}.sql.gz"
    fi
else
    log_message "❌ ERROR: Database backup failed"
    exit 1
fi

# 2. Cleanup old backups (keep only last N days)
log_message "Cleaning up old backups (older than $RETENTION_DAYS days)..."
find "$BACKUP_DIR" -name "fwc_backup_*.sql*" -type f -mtime +$RETENTION_DAYS -delete

log_message "=== Backup process finished ==="

