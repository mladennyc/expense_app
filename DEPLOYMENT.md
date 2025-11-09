# Deployment Guide

This guide covers deploying the Expense App to GitHub, web, and building an Android app.

## 1. GitHub Setup

### Initial Setup

1. **Create a GitHub repository:**
   - Go to https://github.com/new
   - Name it `expense-app` (or your preferred name)
   - Don't initialize with README (we already have one)
   - Click "Create repository"

2. **Initialize Git and push to GitHub:**
   ```bash
   # From project root
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/expense-app.git
   git push -u origin main
   ```

3. **Update config files for production:**
   - Update `frontend/config.js` with your production backend URL
   - Create `backend/.env.example` (template for environment variables)

## 2. Backend Deployment (Required for Web & Mobile)

### Option A: Railway (Recommended - Easy)

1. Go to https://railway.app
2. Sign up/login with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Add a PostgreSQL database (or use SQLite for free tier)
6. Set environment variables:
   - `SMTP_SERVER` (if using email)
   - `SMTP_PORT`
   - `SMTP_USERNAME`
   - `SMTP_PASSWORD`
   - `SENDER_EMAIL`
   - `BASE_URL` (your Railway app URL)
7. Railway will auto-deploy your backend

### Option B: Heroku

1. Install Heroku CLI: https://devcenter.heroku.com/articles/heroku-cli
2. Login: `heroku login`
3. Create app: `heroku create expense-app-backend`
4. Add PostgreSQL: `heroku addons:create heroku-postgresql:mini`
5. Set environment variables:
   ```bash
   heroku config:set SMTP_SERVER=...
   heroku config:set BASE_URL=https://your-app.herokuapp.com
   ```
6. Deploy: `git push heroku main`

### Option C: DigitalOcean / AWS / Google Cloud

- Follow their Python/FastAPI deployment guides
- Make sure to set `--host 0.0.0.0` in production
- Use PostgreSQL instead of SQLite for production

## 3. Web Deployment

### Option A: Vercel (Recommended - Free)

1. Go to https://vercel.com
2. Sign up/login with GitHub
3. Click "New Project" → Import your repository
4. Configure:
   - **Framework Preset:** Other
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build` (if you add build script)
   - **Output Directory:** `web-build`
5. Add environment variable:
   - `EXPO_PUBLIC_API_URL` = your backend URL
6. Deploy

**Note:** For Expo web, you may need to:
- Add `"web": { "build": { "babel": { "include": ["@expo/vector-icons"] } } }` to `app.json`
- Or use Expo's hosting: `expo build:web` then deploy the `web-build` folder

### Option B: Netlify

1. Go to https://netlify.com
2. Connect GitHub repo
3. Set build command: `cd frontend && npm install && npx expo export:web`
4. Set publish directory: `frontend/web-build`
5. Deploy

### Option C: Expo Hosting (Easiest for Expo apps)

1. Install EAS CLI: `npm install -g eas-cli`
2. Login: `eas login`
3. Configure: `eas build:configure`
4. Build web: `cd frontend && eas build --platform web`
5. Deploy: `eas update --branch production --message "Deploy web version"`

## 4. Android App Build

### Prerequisites

1. **Install EAS CLI:**
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo:**
   ```bash
   eas login
   ```

3. **Configure EAS:**
   ```bash
   cd frontend
   eas build:configure
   ```

### Build Android APK (for testing)

1. **Create `eas.json` in `frontend/` directory:**
   ```json
   {
     "build": {
       "development": {
         "developmentClient": true,
         "distribution": "internal"
       },
       "preview": {
         "distribution": "internal",
         "android": {
           "buildType": "apk"
         }
       },
       "production": {
         "android": {
           "buildType": "apk"
         }
       }
     }
   }
   ```

2. **Update `frontend/app.json`:**
   ```json
   {
     "expo": {
       "name": "expense-app",
       "slug": "expense-app",
       "version": "1.0.0",
       "orientation": "portrait",
       "icon": "./assets/icon.png",
       "userInterfaceStyle": "light",
       "splash": {
         "image": "./assets/splash.png",
         "resizeMode": "contain",
         "backgroundColor": "#ffffff"
       },
       "android": {
         "package": "com.yourname.expenseapp",
         "versionCode": 1,
         "adaptiveIcon": {
           "foregroundImage": "./assets/adaptive-icon.png",
           "backgroundColor": "#ffffff"
         }
       },
       "web": {
         "bundler": "metro"
       }
     }
   }
   ```

3. **Build APK:**
   ```bash
   cd frontend
   eas build --platform android --profile preview
   ```

4. **Download and install:**
   - EAS will provide a download link
   - Download the APK
   - Install on Android device (enable "Install from unknown sources")

### Build Android App Bundle (for Google Play Store)

1. **Update `eas.json` production profile:**
   ```json
   {
     "build": {
       "production": {
         "android": {
           "buildType": "app-bundle"
         }
       }
     }
   }
   ```

2. **Build AAB:**
   ```bash
   eas build --platform android --profile production
   ```

3. **Submit to Google Play:**
   - Go to https://play.google.com/console
   - Create app
   - Upload the AAB file
   - Fill in store listing, screenshots, etc.
   - Submit for review

## 5. Update Frontend Config for Production

Update `frontend/config.js`:

```javascript
// For production, use your deployed backend URL
export const BASE_URL = process.env.EXPO_PUBLIC_API_URL || "https://your-backend.railway.app";
```

Or use environment variables:
- Create `.env` in `frontend/` (add to `.gitignore`)
- Add: `EXPO_PUBLIC_API_URL=https://your-backend.railway.app`
- Update `config.js` to use: `process.env.EXPO_PUBLIC_API_URL`

## 6. Environment Variables Checklist

### Backend (.env):
- `SMTP_SERVER` - Email server
- `SMTP_PORT` - Email port (usually 587)
- `SMTP_USERNAME` - Email username
- `SMTP_PASSWORD` - Email password/app password
- `SENDER_EMAIL` - From email address
- `BASE_URL` - Frontend URL (for password reset links)
- `SECRET_KEY` - JWT secret (generate with: `python -c "import secrets; print(secrets.token_urlsafe(32))"`)

### Frontend:
- `EXPO_PUBLIC_API_URL` - Backend API URL

## 7. Quick Start Commands

```bash
# GitHub
git add .
git commit -m "Your message"
git push

# Build Android APK
cd frontend
eas build --platform android --profile preview

# Build for web
cd frontend
npx expo export:web
# Then deploy the web-build folder to Vercel/Netlify
```

## Notes

- **Free tier limits:** Railway/Heroku have free tiers with limitations
- **Database:** Use PostgreSQL in production (not SQLite)
- **CORS:** Make sure backend allows your frontend domain
- **SSL:** Production should use HTTPS (most platforms provide this)
- **Updates:** Use `eas update` for OTA updates without rebuilding

