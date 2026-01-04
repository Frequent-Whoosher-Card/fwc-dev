#!/bin/bash

# Test Connection Script untuk PostgreSQL Database FWC
# File: backend/scripts/test-backup-connection.sh
# Usage: ./test-backup-connection.sh

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

echo "=== Testing Database Connection ==="
echo "Host: $DB_HOST"
echo "Port: $DB_PORT"
echo "Database: $DB_NAME"
echo "User: $DB_USER"
echo ""

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "❌ ERROR: psql command not found. Please install PostgreSQL client tools."
    exit 1
fi

# Test connection
echo "Testing connection..."
PGPASSWORD="$DB_PASSWORD" psql \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    -c "SELECT version();" \
    -c "SELECT current_database(), current_user;" \
    -c "SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'public';"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Connection successful!"
    echo ""
    echo "Testing pg_dump..."
    PGPASSWORD="$DB_PASSWORD" pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --schema-only \
        --no-owner \
        --no-privileges \
        > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        echo "✅ pg_dump test successful!"
        echo ""
        echo "🎉 All tests passed! Backup script should work correctly."
    else
        echo "❌ pg_dump test failed!"
        exit 1
    fi
else
    echo ""
    echo "❌ Connection failed!"
    echo ""
    echo "Troubleshooting:"
    echo "1. Check if database server is running"
    echo "2. Verify DATABASE_URL in .env file"
    echo "3. Check firewall/network settings"
    echo "4. Verify user credentials"
    exit 1
fi




