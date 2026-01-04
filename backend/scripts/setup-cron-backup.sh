#!/bin/bash

# Setup Cron Job untuk Automated Backup
# File: backend/scripts/setup-cron-backup.sh
# Usage: ./setup-cron-backup.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKUP_SCRIPT="$SCRIPT_DIR/backup-database-server.sh"

echo "=== Setup Cron Job untuk FWC Database Backup ==="
echo ""
echo "Script location: $BACKUP_SCRIPT"
echo "Project directory: $PROJECT_DIR"
echo ""

# Check if backup script exists
if [ ! -f "$BACKUP_SCRIPT" ]; then
    echo "ERROR: Backup script not found: $BACKUP_SCRIPT"
    exit 1
fi

# Make sure script is executable
chmod +x "$BACKUP_SCRIPT"

# Get current user
CURRENT_USER=$(whoami)
echo "Current user: $CURRENT_USER"
echo ""

# Cron schedule options
echo "Pilih jadwal backup:"
echo "1. Setiap hari jam 2 pagi (recommended)"
echo "2. Setiap hari jam 3 pagi"
echo "3. Setiap 6 jam"
echo "4. Setiap 12 jam"
echo "5. Custom (masukkan cron expression)"
echo ""
read -p "Pilihan (1-5): " choice

case $choice in
    1)
        CRON_SCHEDULE="0 2 * * *"
        SCHEDULE_DESC="Setiap hari jam 2 pagi"
        ;;
    2)
        CRON_SCHEDULE="0 3 * * *"
        SCHEDULE_DESC="Setiap hari jam 3 pagi"
        ;;
    3)
        CRON_SCHEDULE="0 */6 * * *"
        SCHEDULE_DESC="Setiap 6 jam"
        ;;
    4)
        CRON_SCHEDULE="0 */12 * * *"
        SCHEDULE_DESC="Setiap 12 jam"
        ;;
    5)
        read -p "Masukkan cron expression (contoh: 0 2 * * *): " CRON_SCHEDULE
        SCHEDULE_DESC="Custom: $CRON_SCHEDULE"
        ;;
    *)
        echo "Invalid choice, using default: setiap hari jam 2 pagi"
        CRON_SCHEDULE="0 2 * * *"
        SCHEDULE_DESC="Setiap hari jam 2 pagi"
        ;;
esac

# Create cron job entry
CRON_JOB="$CRON_SCHEDULE cd $PROJECT_DIR && $BACKUP_SCRIPT >> $PROJECT_DIR/logs/cron-backup.log 2>&1"

echo ""
echo "Cron job yang akan ditambahkan:"
echo "$CRON_JOB"
echo ""
echo "Jadwal: $SCHEDULE_DESC"
echo ""
read -p "Tambahkan ke crontab? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Setup cancelled."
    exit 0
fi

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "$BACKUP_SCRIPT"; then
    echo "⚠️  Cron job sudah ada. Menghapus yang lama..."
    crontab -l 2>/dev/null | grep -v "$BACKUP_SCRIPT" | crontab -
fi

# Add new cron job
(crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

if [ $? -eq 0 ]; then
    echo "✅ Cron job berhasil ditambahkan!"
    echo ""
    echo "Cron jobs saat ini:"
    crontab -l
    echo ""
    echo "Untuk melihat log backup:"
    echo "tail -f $PROJECT_DIR/logs/backup.log"
    echo ""
    echo "Untuk melihat cron log:"
    echo "tail -f $PROJECT_DIR/logs/cron-backup.log"
else
    echo "❌ Gagal menambahkan cron job"
    exit 1
fi




