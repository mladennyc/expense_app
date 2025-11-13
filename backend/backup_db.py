#!/usr/bin/env python3
"""Backup Render PostgreSQL database"""
import os
import subprocess
from datetime import datetime

# Get DATABASE_URL from environment or set it here
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("ERROR: DATABASE_URL environment variable not set")
    print("Set it in Render dashboard or export it:")
    print("  Windows: $env:DATABASE_URL='postgresql://...'")
    print("  Mac/Linux: export DATABASE_URL='postgresql://...'")
    exit(1)

# Fix postgres:// to postgresql:// if needed
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Create backup directory
backup_dir = "backups"
os.makedirs(backup_dir, exist_ok=True)

# Create backup filename with timestamp
timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
backup_file = os.path.join(backup_dir, f"kasa_db_backup_{timestamp}.backup")

# Run pg_dump
print(f"Creating backup: {backup_file}")
print(f"Database: {DATABASE_URL.split('@')[1] if '@' in DATABASE_URL else 'hidden'}")
try:
    subprocess.run([
        "pg_dump",
        DATABASE_URL,
        "-F", "c",  # Custom format (compressed)
        "-f", backup_file
    ], check=True)
    
    file_size = os.path.getsize(backup_file)
    print(f"✅ Backup created successfully!")
    print(f"   File: {backup_file}")
    print(f"   Size: {file_size / 1024:.2f} KB")
    
except subprocess.CalledProcessError as e:
    print(f"❌ Backup failed: {e}")
    exit(1)
except FileNotFoundError:
    print("❌ ERROR: pg_dump not found. Install PostgreSQL client tools.")
    print("   Windows: https://www.postgresql.org/download/windows/")
    print("   Mac: brew install postgresql")
    print("   Linux: sudo apt-get install postgresql-client")
    exit(1)


