# Connecting DBeaver to Render PostgreSQL

## Step-by-Step Instructions

### 1. Get Connection Details from Render

1. Go to **https://dashboard.render.com**
2. Click on your **PostgreSQL database**
3. Go to **"Connections"** or **"Info"** tab
4. Find **"Internal Database URL"** or **"Connection String"**
   - Format: `postgresql://username:password@host:port/database`

### 2. Parse the Connection String

Example: `postgresql://postgres:abc123@dpg-xxxxx-a.oregon-postgres.render.com:5432/kasa_db`

- **Host:** `dpg-xxxxx-a.oregon-postgres.render.com`
- **Port:** `5432`
- **Database:** `kasa_db`
- **Username:** `postgres`
- **Password:** `abc123`

### 3. Create Connection in DBeaver

1. **Open DBeaver**
2. Click **"New Database Connection"** (plug icon) or **Database → New Database Connection**
3. Select **PostgreSQL** from the list
4. Click **Next**

### 4. Enter Connection Details

Fill in the fields:
- **Host:** (from step 2)
- **Port:** (from step 2, usually 5432)
- **Database:** (from step 2)
- **Username:** (from step 2)
- **Password:** (from step 2)
- **Show all databases:** (optional, check if you want to see all databases)

### 5. Test Connection

1. Click **"Test Connection"**
2. If prompted to download PostgreSQL driver, click **Download**
3. Wait for "Connected" message
4. Click **Finish**

### 6. Query Your Data

Once connected:
1. Expand your database in the left panel
2. Expand **"Schemas" → "public" → "Tables"**
3. Right-click on **"users"** table → **"View Data"**
4. Or open SQL Editor (SQL icon) and run:

```sql
-- Check users
SELECT id, email, username, name, created_at FROM users;

-- Count records
SELECT 
  (SELECT COUNT(*) FROM users) as user_count,
  (SELECT COUNT(*) FROM expenses) as expense_count,
  (SELECT COUNT(*) FROM incomes) as income_count;

-- Check specific user
SELECT * FROM users WHERE email = 'your-email@example.com';
```

## Troubleshooting

- **Connection timeout:** Make sure you're using the correct host/port
- **Authentication failed:** Double-check username and password
- **SSL required:** In DBeaver connection settings, go to "SSL" tab and enable SSL if needed
- **Driver not found:** DBeaver will prompt to download - click "Download"

## Alternative: Using Connection String Directly

If DBeaver supports it:
1. In connection settings, look for "URL" field
2. Paste your full `postgresql://` connection string
3. DBeaver will parse it automatically


