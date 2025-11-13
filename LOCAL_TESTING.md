# Local Testing Guide

## Quick Start for Local Testing

### Step 1: Start the Backend

Open a terminal and run:

```powershell
cd backend
.venv\Scripts\activate
uvicorn main:app --host 0.0.0.0 --port 8000
```

**Important:** The `--host 0.0.0.0` flag is required so your phone/other devices can access the backend on your local network.

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Step 2: Start the Frontend (with Local Backend)

Open a **new terminal** and run:

```powershell
cd frontend
npm run start:local
```

This will:
- Set `EXPO_PUBLIC_USE_LOCAL_BACKEND=true` automatically
- Start Expo with your local network IP (192.168.1.76)
- Connect to your local backend at `http://192.168.1.76:8000`

### Alternative: Manual Environment Variable

If you prefer to use `npm start`, you can set the environment variable manually:

**Windows PowerShell:**
```powershell
$env:EXPO_PUBLIC_USE_LOCAL_BACKEND="true"
npm start
```

**Windows CMD:**
```cmd
set EXPO_PUBLIC_USE_LOCAL_BACKEND=true
npm start
```

**Mac/Linux:**
```bash
EXPO_PUBLIC_USE_LOCAL_BACKEND=true npm start
```

## Verify It's Working

1. **Check Backend:** Open http://192.168.1.76:8000/docs in your browser - you should see the API documentation
2. **Check Frontend Console:** When the app starts, you should see:
   ```
   ⚠️ USING LOCAL BACKEND - This should only be used for development!
   ```
3. **Test Login:** Try logging in - it should connect to your local backend

## Troubleshooting

### "Cannot connect to backend"
- Make sure the backend is running on port 8000
- Check that you're using `--host 0.0.0.0` (not just `localhost`)
- Verify your IP address is correct (run `ipconfig` to check)

### Frontend still connecting to production
- Make sure you used `npm run start:local` (not just `npm start`)
- Or verify the environment variable is set: `echo $EXPO_PUBLIC_USE_LOCAL_BACKEND` (should show "true")
- Restart the Expo server after setting the variable

### Backend not accessible from phone
- Make sure both devices are on the same WiFi network
- Check Windows Firewall - it may be blocking port 8000
- Try accessing http://192.168.1.76:8000/docs from your phone's browser

## Switching Back to Production

Just use the regular `npm start` command (without the `:local` suffix). The app will automatically use the production backend URL.

