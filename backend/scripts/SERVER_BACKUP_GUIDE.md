# Server Backup Guide

## Setup Backup di Server

### 1. Manual Backup (One-time)

```bash
# SSH ke server
ssh user@your-server.com

# Masuk ke project directory
cd /path/to/fwc/backend

# Jalankan backup
npm run db:backup:server
# atau
./scripts/backup-database-server.sh
```

### 2. Automated Backup dengan Cron Job

#### Setup Cron Job Otomatis

```bash
# Di server
cd /path/to/fwc/backend
npm run db:cron:setup
# atau
./scripts/setup-cron-backup.sh
```

Script akan:
- Menanyakan jadwal backup (setiap hari jam 2 pagi, dll)
- Menambahkan cron job ke crontab
- Setup logging otomatis

#### Manual Cron Setup

Edit crontab:
```bash
crontab -e
```

Tambahkan:
```bash
# Backup FWC database setiap hari jam 2 pagi
0 2 * * * cd /path/to/fwc/backend && ./scripts/backup-database-server.sh >> /path/to/fwc/backend/logs/cron-backup.log 2>&1
```

### 3. Environment Variables di Server

Pastikan `.env` file di server memiliki:

```bash
# .env di server
DATABASE_URL=postgresql://user:password@localhost:5432/fwc

# Atau individual variables
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fwc
DB_USER=postgres
DB_PASSWORD=your_secure_password

# Optional: Cloud storage (jika menggunakan rclone)
RCLONE_REMOTE=gdrive_backup
```

### 4. Backup Location

- Default: `backend/backups/`
- Format: `fwc_backup_YYYYMMDD_HHMMSS.dump.gz`
- Retention: 7 hari (otomatis dihapus)
- Logs: `backend/logs/backup.log`

### 5. Monitoring Backup

#### Check Logs

```bash
# Backup log
tail -f /path/to/fwc/backend/logs/backup.log

# Cron execution log
tail -f /path/to/fwc/backend/logs/cron-backup.log
```

#### List Backups

```bash
ls -lh /path/to/fwc/backend/backups/
```

#### Check Cron Jobs

```bash
crontab -l
```

### 6. Upload ke Cloud Storage (Optional)

Uncomment bagian upload di `backup-database-server.sh`:

```bash
# Install rclone dulu
# https://rclone.org/install/

# Setup rclone remote
rclone config

# Uncomment di backup-database-server.sh:
if command -v rclone &> /dev/null && [ -n "$RCLONE_REMOTE" ]; then
    log_message "Uploading to cloud storage..."
    rclone copy "$BACKUP_DIR/${BACKUP_NAME}.dump.gz" "$RCLONE_REMOTE:backups/fwc/" --progress
fi
```

### 7. Restore dari Backup

```bash
# Di server
cd /path/to/fwc/backend
./scripts/restore-database.sh backups/fwc_backup_20250101_020000.dump.gz
```

### 8. Troubleshooting

#### Permission Denied
```bash
chmod +x scripts/*.sh
```

#### pg_dump not found
```bash
# Ubuntu/Debian
sudo apt-get install postgresql-client

# CentOS/RHEL
sudo yum install postgresql

# macOS
brew install postgresql
```

#### Database Connection Error
- Check `.env` file
- Verify DATABASE_URL format
- Test connection: `psql $DATABASE_URL`

#### Cron Job Not Running
- Check cron service: `systemctl status cron` (Linux)
- Check cron logs: `grep CRON /var/log/syslog`
- Verify user permissions

### 9. Best Practices

1. **Test backup script** sebelum setup cron
2. **Monitor logs** secara berkala
3. **Verify backup files** ada dan tidak kosong
4. **Setup cloud backup** untuk redundancy
5. **Test restore** secara berkala
6. **Keep multiple backups** (jangan hanya 1 file)

### 10. Notification (Optional)

Uncomment dan setup notification di `backup-database-server.sh`:

```bash
# Telegram
TELEGRAM_BOT_TOKEN="your_bot_token"
TELEGRAM_CHAT_ID="your_chat_id"

# Email
# Setup mail server atau gunakan sendmail
```




