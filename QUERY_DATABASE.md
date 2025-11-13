# How to Query Render PostgreSQL Database

## Method 1: Using psql (Command Line)

1. **Get your DATABASE_URL from Render:**
   - Go to Render Dashboard → Your PostgreSQL Database
   - Click on "Connections" or "Info" tab
   - Copy the "Internal Database URL" or "External Connection String"
   - Format: `postgresql://user:password@host:port/database`

2. **Connect using psql:**
   ```bash
   psql "postgresql://user:password@host:port/database"
   ```

3. **Query users:**
   ```sql
   SELECT id, email, username, name, created_at FROM users;
   ```

4. **Check counts:**
   ```sql
   SELECT COUNT(*) FROM users;
   SELECT COUNT(*) FROM expenses;
   SELECT COUNT(*) FROM incomes;
   ```

5. **Exit:**
   ```sql
   \q
   ```

## Method 2: Using pgAdmin or DBeaver (GUI Tools)

1. **Download pgAdmin or DBeaver** (free database GUI tools)

2. **Get connection details from Render:**
   - Host: (from DATABASE_URL)
   - Port: (from DATABASE_URL, usually 5432)
   - Database: (from DATABASE_URL)
   - Username: (from DATABASE_URL)
   - Password: (from DATABASE_URL)

3. **Connect and run queries:**
   ```sql
   SELECT * FROM users;
   SELECT * FROM expenses;
   SELECT * FROM incomes;
   ```

## Method 3: Using Render's Web Console (if available)

1. Go to Render Dashboard → Your PostgreSQL Database
2. Look for "Connect" or "Console" button
3. Use the web-based SQL editor

## Method 4: Using Python Script (Local)

Create a file `query_db.py`:

```python
import os
from sqlalchemy import create_engine, text

DATABASE_URL = "YOUR_DATABASE_URL_HERE"  # Get from Render dashboard

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    # Query users
    result = conn.execute(text("SELECT id, email, username, name FROM users"))
    print("Users:")
    for row in result:
        print(f"  {row}")
    
    # Count users
    result = conn.execute(text("SELECT COUNT(*) FROM users"))
    count = result.scalar()
    print(f"\nTotal users: {count}")
```

Run: `python query_db.py`

## Quick SQL Queries to Check Data

```sql
-- Check if users exist
SELECT COUNT(*) as user_count FROM users;

-- List all users
SELECT id, email, username, name, created_at FROM users ORDER BY created_at DESC;

-- Check expenses
SELECT COUNT(*) as expense_count FROM expenses;

-- Check incomes  
SELECT COUNT(*) as income_count FROM incomes;

-- Check specific user by email
SELECT * FROM users WHERE email = 'your-email@example.com';

-- Check all tables
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
```


