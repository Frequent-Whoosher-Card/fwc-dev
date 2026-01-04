# Database Backup & Restore Guide

## Backup Database

### Manual Backup

```bash
# Dari directory backend/
cd backend
./scripts/backup-database.sh
```

### Environment Variables

Script akan membaca dari `.env` file atau environment variables:

```bash
# .env file
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fwc
DB_USER=postgres
DB_PASSWORD=your_password

# Atau set langsung
export DB_PASSWORD=your_password
./scripts/backup-database.sh
```

### Backup Location

- Default: `./backups/`
- Format: `fwc_backup_YYYYMMDD_HHMMSS.dump.gz`
- Retention: 7 hari (otomatis dihapus)

### Custom Backup Directory

```bash
BACKUP_DIR=/path/to/backups ./scripts/backup-database.sh
```

## Restore Database

### Restore dari Backup

```bash
# Dari directory backend/
cd backend
./scripts/restore-database.sh backups/fwc_backup_20250101_120000.dump.gz
```

⚠️ **WARNING**: Restore akan mengganti semua data di database!

## Alternative: Simple pg_dump Command

Jika ingin backup manual tanpa script:

```bash
# Backup (custom format - recommended)
pg_dump -h localhost -U postgres -d fwc --format=custom --file=backup.dump

# Backup (SQL format)
pg_dump -h localhost -U postgres -d fwc --file=backup.sql

# Compress
gzip backup.dump
```

## Restore dari SQL File

```bash
# Restore dari SQL file
psql -h localhost -U postgres -d fwc < backup.sql
```

## Restore dari Custom Format

```bash
# Restore dari custom format
pg_restore -h localhost -U postgres -d fwc --clean --if-exists backup.dump
```

## Automated Daily Backup (Cron)

Tambahkan ke crontab untuk backup otomatis:

```bash
# Edit crontab
crontab -e

# Backup setiap hari jam 2 pagi
0 2 * * * cd /path/to/fwc/backend && ./scripts/backup-database.sh >> /var/log/fwc-backup.log 2>&1
```

## Backup ke Cloud Storage (Optional)

Untuk upload ke cloud storage, tambahkan di akhir script:

```bash
# Upload ke Google Drive (jika menggunakan rclone)
rclone copy "$BACKUP_DIR/${BACKUP_NAME}.dump.gz" "gdrive:backups/fwc/" --progress

# Upload ke S3
aws s3 cp "$BACKUP_DIR/${BACKUP_NAME}.dump.gz" s3://your-bucket/backups/fwc/
```




