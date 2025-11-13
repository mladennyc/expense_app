# How to Backup Your Render PostgreSQL Database

## ⚠️ IMPORTANT: Always backup before making database changes!

---

## Method 1: Using DBeaver (Easiest - GUI)

### Step-by-Step:

1. **Open DBeaver** and connect to your Render database

2. **Right-click on your database** (e.g., `kasa_db`) in the left panel

3. **Select "Tools" → "Backup"**

4. **Configure backup settings:**
   - **Format:** Choose "Custom" (recommended) or "Plain SQL"
   - **File:** Choose where to save (e.g., `C:\backups\kasa_db_backup_2024-01-15.backup`)
   - **Options:**
     - ✅ Include CREATE DATABASE
     - ✅ Include DROP DATABASE (optional)
     - ✅ Include schema
     - ✅ Include data

5. **Click "Start"** and wait for backup to complete

6. **Verify backup file exists** in your chosen location

### To Restore from Backup in DBeaver:

1. Right-click database → **"Tools" → "Restore"**
2. Select your backup file
3. Click "Start"

---

## Method 2: Using pg_dump (Command Line)

### Prerequisites:
- Install PostgreSQL client tools on your computer
- Windows: Download from https://www.postgresql.org/download/windows/
- Mac: `brew install postgresql`
- Linux: `sudo apt-get install postgresql-client`

### Backup Command:

```bash
# Get your DATABASE_URL from Render dashboard
# Format: postgresql://user:password@host:port/database

# Create backup (replace with your actual DATABASE_URL)
pg_dump "postgresql://kasa_user:YOUR_PASSWORD@dpg-xxxxx.virginia-postgres.render.com:5432/kasa_db" -F c -f kasa_db_backup_$(date +%Y%m%d_%H%M%S).backup

# Or for plain SQL format (easier to read):
pg_dump "postgresql://kasa_user:YOUR_PASSWORD@dpg-xxxxx.virginia-postgres.render.com:5432/kasa_db" -f kasa_db_backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore Command:

```bash
# Restore from custom format backup:
pg_restore -d "postgresql://kasa_user:YOUR_PASSWORD@dpg-xxxxx.virginia-postgres.render.com:5432/kasa_db" kasa_db_backup_20240115_120000.backup

# Or restore from SQL file:
psql "postgresql://kasa_user:YOUR_PASSWORD@dpg-xxxxx.virginia-postgres.render.com:5432/kasa_db" < kasa_db_backup_20240115_120000.sql
```

---

## Method 3: Python Backup Script (Automated)

Create a file `backup_db.py`:

```python
#!/usr/bin/env python3
"""Backup Render PostgreSQL database"""
import os
import subprocess
from datetime import datetime

# Get DATABASE_URL from environment or set it here
DATABASE_URL = os.getenv("DATABASE_URL", "YOUR_DATABASE_URL_HERE")

if not DATABASE_URL or DATABASE_URL == "YOUR_DATABASE_URL_HERE":
    print("ERROR: Set DATABASE_URL environment variable or edit this script")
    exit(1)

# Create backup filename with timestamp
timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
backup_file = f"kasa_db_backup_{timestamp}.backup"

# Run pg_dump
print(f"Creating backup: {backup_file}")
try:
    subprocess.run([
        "pg_dump",
        DATABASE_URL,
        "-F", "c",  # Custom format (compressed)
        "-f", backup_file
    ], check=True)
    print(f"✅ Backup created successfully: {backup_file}")
    print(f"   File size: {os.path.getsize(backup_file) / 1024:.2f} KB")
except subprocess.CalledProcessError as e:
    print(f"❌ Backup failed: {e}")
    exit(1)
except FileNotFoundError:
    print("❌ ERROR: pg_dump not found. Install PostgreSQL client tools.")
    print("   Windows: https://www.postgresql.org/download/windows/")
    print("   Mac: brew install postgresql")
    exit(1)
```

### To use the script:

1. **Set DATABASE_URL:**
   ```bash
   # Windows PowerShell:
   $env:DATABASE_URL="postgresql://user:pass@host:port/db"
   
   # Windows CMD:
   set DATABASE_URL=postgresql://user:pass@host:port/db
   
   # Mac/Linux:
   export DATABASE_URL="postgresql://user:pass@host:port/db"
   ```

2. **Run the script:**
   ```bash
   python backup_db.py
   ```

---

## Method 4: Quick Backup Before Code Changes

### Create a simple backup script `quick_backup.bat` (Windows) or `quick_backup.sh` (Mac/Linux):

**Windows (`quick_backup.bat`):**
```batch
@echo off
set DATABASE_URL=YOUR_DATABASE_URL_HERE
set BACKUP_DIR=backups
if not exist %BACKUP_DIR% mkdir %BACKUP_DIR%

for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c-%%a-%%b)
for /f "tokens=1-2 delims=/:" %%a in ('time /t') do (set mytime=%%a%%b)

pg_dump "%DATABASE_URL%" -F c -f %BACKUP_DIR%\kasa_backup_%mydate%_%mytime%.backup
echo Backup created in %BACKUP_DIR%\
```

**Mac/Linux (`quick_backup.sh`):**
```bash
#!/bin/bash
DATABASE_URL="YOUR_DATABASE_URL_HERE"
BACKUP_DIR="backups"
mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
pg_dump "$DATABASE_URL" -F c -f "$BACKUP_DIR/kasa_backup_$TIMESTAMP.backup"

echo "✅ Backup created: $BACKUP_DIR/kasa_backup_$TIMESTAMP.backup"
```

---

## Best Practices

### 1. **Before Any Database Changes:**
   - ✅ Always create a backup first
   - ✅ Test restore on a local database if possible
   - ✅ Keep multiple backup versions

### 2. **Backup Schedule:**
   - **Daily backups** for active databases
   - **Before deployments** that change database schema
   - **Before major data migrations**

### 3. **Storage:**
   - Store backups in multiple locations:
     - Local computer
     - Cloud storage (Google Drive, Dropbox, etc.)
     - External hard drive

### 4. **Verify Backups:**
   - Periodically test restoring from backups
   - Check backup file sizes (should be > 0)
   - Keep backup logs

---

## Render Free Tier Limitations

⚠️ **Important:** Render's free PostgreSQL tier:
- **No automatic backups**
- **No point-in-time recovery**
- **Databases expire after 30 days**

**Solution:** You MUST create manual backups regularly!

---

## Quick Reference

### Backup Commands:
```bash
# Custom format (recommended - compressed)
pg_dump "DATABASE_URL" -F c -f backup.backup

# Plain SQL (readable, larger file)
pg_dump "DATABASE_URL" -f backup.sql
```

### Restore Commands:
```bash
# From custom format
pg_restore -d "DATABASE_URL" backup.backup

# From SQL file
psql "DATABASE_URL" < backup.sql
```

---

## Emergency Recovery

If you need to restore from backup:

1. **Stop your backend service** (to prevent new writes)
2. **Drop existing tables** (if needed):
   ```sql
   DROP TABLE IF EXISTS incomes CASCADE;
   DROP TABLE IF EXISTS expenses CASCADE;
   DROP TABLE IF EXISTS users CASCADE;
   ```
3. **Restore from backup** using one of the methods above
4. **Restart your backend service**

---

## Automated Daily Backups (Advanced)

### Windows Task Scheduler:
1. Create `daily_backup.bat` with backup command
2. Open Task Scheduler
3. Create new task → Run daily at 3 AM
4. Action: Run `daily_backup.bat`

### Mac/Linux Cron:
```bash
# Edit crontab
crontab -e

# Add this line (backup daily at 3 AM):
0 3 * * * /path/to/backup_script.sh >> /path/to/backup.log 2>&1
```

---

**Remember: A backup is only good if you can restore from it! Test your backups regularly.**


