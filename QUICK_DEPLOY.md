# Quick Deployment Guide

## Step 1: Push to GitHub

### 1.1 Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `expense-app` (or your choice)
3. **Don't** check "Initialize with README" (we already have files)
4. Click "Create repository"

### 1.2 Push Your Code

Open terminal in your project folder and run:

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Expense App"

# Add GitHub remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/expense-app.git

# Push to GitHub
git branch -M main
git push -u origin main
```

**If you get authentication errors:**
- Use a Personal Access Token (PAT) instead of password
- Go to GitHub Settings → Developer settings → Personal access tokens → Generate new token
- Use the token as your password when pushing

---

## Step 2: Deploy Backend (Make it accessible online)

### Option A: Railway (Easiest - Recommended)

1. Go to https://railway.app
2. Sign up/login with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your `expense-app` repository
5. Railway will detect it's Python
6. Set these in "Variables" tab:
   ```
   PORT=8000
   ```
7. Add a "Start Command":
   - Click on your service
   - Go to "Settings" → "Deploy"
   - Set "Start Command": `cd backend && pip install -r requirements.txt && uvicorn main:app --host 0.0.0.0 --port $PORT`
8. Railway will give you a URL like: `https://your-app.railway.app`
9. **Copy this URL** - you'll need it for the frontend!

### Option B: Render (Free Alternative)

1. Go to https://render.com
2. Sign up/login with GitHub
3. Click "New" → "Web Service"
4. Connect your GitHub repo
5. Settings:
   - **Name:** expense-app-backend
   - **Root Directory:** backend
   - **Environment:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Click "Create Web Service"
7. **Copy the URL** (e.g., `https://expense-app-backend.onrender.com`)

---

## Step 3: Update Frontend Config

1. Open `frontend/config.js`
2. Replace the URL with your deployed backend URL:

```javascript
// Replace with your Railway/Render URL
export const BASE_URL = "https://your-app.railway.app";  // or your Render URL
```

3. Commit and push:
```bash
git add frontend/config.js
git commit -m "Update backend URL for production"
git push
```

---

## Step 4: Deploy Frontend Web App

### Option A: Vercel (Easiest for Web)

1. Go to https://vercel.com
2. Sign up/login with GitHub
3. Click "New Project" → Import your repository
4. Settings:
   - **Framework Preset:** Other
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npx expo export:web`
   - **Output Directory:** `web-build`
5. Add Environment Variable:
   - Name: `EXPO_PUBLIC_API_URL`
   - Value: Your backend URL (from Step 2)
6. Click "Deploy"
7. Vercel will give you a URL like: `https://expense-app.vercel.app`

### Option B: Netlify

1. Go to https://netlify.com
2. Sign up/login with GitHub
3. Click "Add new site" → "Import an existing project"
4. Select your repository
5. Settings:
   - **Base directory:** `frontend`
   - **Build command:** `npm install && npx expo export:web`
   - **Publish directory:** `frontend/web-build`
6. Add Environment Variable:
   - `EXPO_PUBLIC_API_URL` = Your backend URL
7. Click "Deploy site"

---

## Step 5: Build Android App (Optional)

### For Testing (APK)

1. Install EAS CLI:
   ```bash
   npm install -g eas-cli
   ```

2. Login:
   ```bash
   eas login
   ```

3. Configure:
   ```bash
   cd frontend
   eas build:configure
   ```

4. Update `frontend/config.js` with production backend URL

5. Build APK:
   ```bash
   eas build --platform android --profile preview
   ```

6. Download APK from the link provided
7. Install on Android phone (enable "Install from unknown sources")

---

## Quick Checklist

- [ ] Code pushed to GitHub
- [ ] Backend deployed (Railway/Render)
- [ ] Backend URL copied
- [ ] Frontend `config.js` updated with backend URL
- [ ] Frontend deployed (Vercel/Netlify)
- [ ] Test web app works
- [ ] (Optional) Build Android APK

---

## Troubleshooting

### Backend not working
- Check Railway/Render logs
- Make sure `--host 0.0.0.0` is in start command
- Verify PORT environment variable

### Frontend can't connect to backend
- Check CORS settings in `backend/main.py` (should allow `*` for now)
- Verify backend URL in `frontend/config.js`
- Make sure backend is actually running (check Railway/Render dashboard)

### Build errors
- Make sure all dependencies are in `requirements.txt` (backend)
- Make sure all dependencies are in `package.json` (frontend)
- Check build logs in deployment platform

---

## Next Steps

- Add custom domain (optional)
- Set up email for password reset (see `backend/EMAIL_SETUP.md`)
- Switch to PostgreSQL for production (better than SQLite)
- Add environment variables for secrets (SECRET_KEY, etc.)

