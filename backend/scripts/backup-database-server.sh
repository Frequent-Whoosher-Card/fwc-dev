#!/bin/bash

# Backup Script untuk PostgreSQL Database FWC (Production Server)
# File: backend/scripts/backup-database-server.sh
# Designed untuk dijalankan di server dengan cron job

# Load environment variables from .env file (if exists)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

if [ -f "$PROJECT_DIR/.env" ]; then
    export $(cat "$PROJECT_DIR/.env" | grep -v '^#' | xargs)
fi

# Parse DATABASE_URL or use individual variables
if [ -n "$DATABASE_URL" ]; then
    # Remove query parameters (e.g., ?sslmode=disable)
    DB_URL_CLEAN=$(echo "$DATABASE_URL" | sed 's/?.*$//')
    
    # Parse PostgreSQL connection string
    # Format: postgresql://user:password@host:port/database
    # Handle URL encoding in password (e.g., %23 -> #)
    
    # Extract components using sed
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
    
    # Decode URL-encoded password (handle common encodings)
    # %23 = #, %40 = @, %3A = :, %2F = /, %3F = ?, %25 = %
    DB_PASSWORD=$(echo "$DB_PASSWORD_ENCODED" | sed 's/%23/#/g; s/%40/@/g; s/%3A/:/g; s/%2F/\//g; s/%3F/?/g; s/%25/%/g')
    
    # If Python is available, use it for proper URL decoding (more accurate)
    if command -v python3 &> /dev/null; then
        DB_PASSWORD=$(python3 -c "import urllib.parse; print(urllib.parse.unquote('$DB_PASSWORD_ENCODED'))")
    elif command -v python &> /dev/null; then
        DB_PASSWORD=$(python -c "import urllib.parse; print(urllib.parse.unquote('$DB_PASSWORD_ENCODED'))")
    fi
else
    DB_HOST="${DB_HOST:-localhost}"
    DB_PORT="${DB_PORT:-5432}"
    DB_NAME="${DB_NAME:-fwc}"
    DB_USER="${DB_USER:-postgres}"
    DB_PASSWORD="${DB_PASSWORD:-}"
fi

# Backup settings
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_DIR/backups}"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="fwc_backup_${DATE}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"

# Logging
LOG_DIR="${LOG_DIR:-$PROJECT_DIR/logs}"
LOG_FILE="${LOG_FILE:-$LOG_DIR/backup.log}"

# Create directories
mkdir -p "$BACKUP_DIR"
mkdir -p "$LOG_DIR"

# Function untuk logging
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Function untuk send notification (optional - uncomment if needed)
# send_notification() {
#     local message="$1"
#     # Telegram, Email, Slack, etc.
#     # curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
#     #     -d chat_id="$TELEGRAM_CHAT_ID" \
#     #     -d text="$message"
# }

log_message "=== Starting FWC Database Backup ==="
log_message "Database: $DB_NAME"
log_message "Host: $DB_HOST:$DB_PORT"
log_message "User: $DB_USER"
log_message "Backup directory: $BACKUP_DIR"

# Mask password in logs (show only first 2 chars)
if [ -n "$DB_PASSWORD" ]; then
    PASSWORD_MASKED="${DB_PASSWORD:0:2}****"
    log_message "Password: $PASSWORD_MASKED"
fi

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
    --verbose 2>&1 | tee -a "$LOG_FILE"

BACKUP_EXIT_CODE=$?

if [ $BACKUP_EXIT_CODE -eq 0 ]; then
    log_message "✅ Database backup completed successfully"
    
    # Get backup size
    BACKUP_SIZE=$(du -h "$BACKUP_DIR/${BACKUP_NAME}.sql" | cut -f1)
    log_message "📦 Backup size: $BACKUP_SIZE"
    
    # Create compressed version
    log_message "Creating compressed backup..."
    gzip -c "$BACKUP_DIR/${BACKUP_NAME}.sql" > "$BACKUP_DIR/${BACKUP_NAME}.sql.gz"
    
    if [ $? -eq 0 ]; then
        COMPRESSED_SIZE=$(du -h "$BACKUP_DIR/${BACKUP_NAME}.sql.gz" | cut -f1)
        log_message "✅ Compressed backup created: $COMPRESSED_SIZE"
        # Remove uncompressed file to save space
        rm "$BACKUP_DIR/${BACKUP_NAME}.sql"
        log_message "📦 Final backup file: $BACKUP_DIR/${BACKUP_NAME}.sql.gz"
        
        # Optional: Upload to cloud storage (uncomment if needed)
        # if command -v rclone &> /dev/null && [ -n "$RCLONE_REMOTE" ]; then
        #     log_message "Uploading to cloud storage..."
        #     rclone copy "$BACKUP_DIR/${BACKUP_NAME}.sql.gz" "$RCLONE_REMOTE:backups/fwc/" --progress 2>&1 | tee -a "$LOG_FILE"
        #     if [ $? -eq 0 ]; then
        #         log_message "✅ Uploaded to cloud storage successfully"
        #     else
        #         log_message "⚠️  WARNING: Cloud upload failed (backup file still exists locally)"
        #     fi
        # fi
    else
        log_message "⚠️  WARNING: Compression failed, keeping uncompressed backup"
    fi
else
    log_message "❌ ERROR: Database backup failed (exit code: $BACKUP_EXIT_CODE)"
    exit 1
fi

# 2. Cleanup old backups (keep only last N days)
log_message "Cleaning up old backups (older than $RETENTION_DAYS days)..."
DELETED_COUNT=$(find "$BACKUP_DIR" -name "fwc_backup_*.sql*" -type f -mtime +$RETENTION_DAYS -delete -print | wc -l)
if [ $DELETED_COUNT -gt 0 ]; then
    log_message "🗑️  Deleted $DELETED_COUNT old backup file(s)"
else
    log_message "ℹ️  No old backups to delete"
fi

# 3. Cleanup old logs (keep last 30 days)
log_message "Cleaning up old logs..."
find "$LOG_DIR" -name "*.log" -type f -mtime +30 -delete

# 4. Summary
FINAL_SIZE=$(du -h "$BACKUP_DIR/${BACKUP_NAME}.sql.gz" 2>/dev/null | cut -f1 || echo "N/A")
log_message "=== Backup process finished ==="
log_message "📦 Final backup size: $FINAL_SIZE"
log_message "📁 Backup location: $BACKUP_DIR/${BACKUP_NAME}.sql.gz"

# Optional: Send success notification
# send_notification "✅ FWC Backup Success\n📦 Size: $FINAL_SIZE\n📅 $(date '+%Y-%m-%d %H:%M:%S')"

exit 0

