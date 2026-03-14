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

## 4b. Android APK direct download (best practice)

**Use this when:** You want a "Download Android app" link on the web app so users can install the APK without the Play Store.

**Best practice (one approach):** Host the APK on **GitHub Releases**. No new services, no 65MB file in Git, no backend file upload. One stable direct-download URL.

1. **Build the APK** (from `frontend/`):
   ```bash
   npm run build:android:preview
   ```
2. **Download the APK** from the EAS build page (expo.dev → your project → Builds → that build → Download).
3. **Create a GitHub Release:**
   - Repo → **Releases** → **Create a new release**.
   - Tag (e.g. `v1.0.0`). Title optional.
   - Drag and drop the APK file into the release assets. Publish.
4. **Get the direct download URL:**
   - On the release page, right‑click the APK asset → **Copy link address**.
   - Format: `https://github.com/OWNER/REPO/releases/download/TAG/kasa.apk`
5. **Use that URL** in the app for the "Download Android app" button (e.g. in `frontend/config.js` as `ANDROID_DOWNLOAD_URL` and point the button to it).
6. **When you have a new build:** Create a new release (new tag), attach the new APK, and update the URL in the app if you want the button to point to the latest.

**Do not:** Commit the APK to Git (repo bloat, GitHub warnings). **Do not:** Add new hosting services unless you prefer them over GitHub Releases.

### 4b.1 Download button inside the app (after login) – best practice

**Goal:** Show a "Download Android app" option inside the app once the user is logged in (so web users can install the native app).

**Best practice (researched):**

1. **Show only on web.** When the user is in the native Android app, do not show the button (they already have the app). Use `Platform.OS === 'web'` so the button appears only in the web build.

2. **Placement – one clear place, outside the main flow.** Don’t block login or main actions. Common options:
   - **Settings / Profile screen** – e.g. "Get the Android app" in Settings. Most common and least intrusive.
   - **Header or nav** – small link next to other nav items (e.g. "Download app").
   - **Footer** – optional secondary placement.
   Avoid showing it in multiple places; one location is enough.

3. **Don’t overwhelm.** If you use a banner, allow the user to dismiss it and remember that choice (e.g. in AsyncStorage) so you don’t prompt again every time. Re-show only after a meaningful change (e.g. after they sign in again or after a long time).

5. **Same link as login.** Use the same download URL (your backend `/download/android` or your GitHub Releases URL) for both the login-screen button and the in-app button.

**Summary:** Web-only, one place (Settings or header), same URL as login; use a download icon ± short text (no Play Store badge for direct APK); optional dismiss + remember for banners.

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

## 8. EAS Build Issues Encountered & Fixes (for next time)

This section documents issues we hit during EAS Android production builds and how to avoid or fix them.

### 8.1 Metro config: "does not extend @expo/metro-config"

- **Symptom:** EAS warns: "It looks like that you are using a custom metro.config.js that does not extend @expo/metro-config" and asks to abort.
- **Cause:** Old eas-cli (e.g. 13.x) used a check that had false positives; it could warn even when the project correctly uses `getDefaultConfig(__dirname)` from Expo.
- **Fix:** Use **eas-cli 16.3.3 or later** in `frontend/package.json` (e.g. `"eas-cli": "^16.3.3"`). Run `npm install` and re-run the build. Do **not** change `metro.config.js` to `require('@expo/metro-config')`; keep `require('expo/metro-config')` per Expo docs.
- **Ref:** `docs/EAS_METRO_CONFIG_WARNING_FINDINGS.md`

### 8.2 EAS CLI messages (informational / optional)

- **"eas-cli@X is now available" / "Proceeding with outdated version"** – Informational. The project uses the version in package.json; build continues. To use latest, bump `eas-cli` in package.json and run `npm install`.
- **"Use cli.version in eas.json"** – Optional. Add `"cli": { "version": ">=16.3.3" }` in `frontend/eas.json` to enforce eas-cli version for the project.
- **"cli.appVersionSource is not set, but will be required in the future"** – Optional now. Add `"cli": { "appVersionSource": "remote" }` (recommended) or `"local"` in `frontend/eas.json` for versionCode/buildNumber management.
- **"No environment variables for production on EAS"** – Informational. Only configure if you need build-time env vars (e.g. API URL); set them in Expo project → Environment variables or in build profile `env`.
- **Ref:** `docs/EAS_CLI_AND_APP_VERSION_WARNINGS_FINDINGS.md`

### 8.3 First Android production build: keystore

- **Prompt:** "Generate a new Android Keystore? » (Y/n)"
- **Action:** Press **Y** for the first production build. EAS creates the keystore and stores it on Expo's servers ("Using remote Android credentials"). You must use this same Expo account for all future Play Store updates for this app.

### 8.4 Build in progress: what’s normal

- **"Run expo doctor" with yellow warning** – Common; doctor reports suggestions. Build continues. You can fix doctor issues later by expanding that step’s logs on expo.dev.
- **"Run gradlew" taking several minutes** – Normal. Android native build (Gradle) often takes 2–10+ minutes. Wait for it to finish.

### 8.5 Build failure: react-native-screens Kotlin errors

- **Symptom:** Build fails in "Run gradlew" with Kotlin errors in `react-native-screens`, e.g.:
  - `Unresolved reference 'ChoreographerCompat'`
  - `Class '...' is not abstract and does not implement abstract member...` (pointerEvents, onChildStartedNativeGesture, handleException)
- **Cause:** **Version mismatch.** Expo 54 with React Native 0.81 requires **react-native-screens ~4.12.0**. Using ~4.4.0 causes these compilation errors on EAS.
- **Fix:** In `frontend/package.json`, set `"react-native-screens": "~4.12.0"`. Run `npm install`, then re-run `npx eas build --platform android --profile production`. Alternatively run `npx expo install react-native-screens` to let Expo pick the compatible version.

### 8.6 Build failure: expo-camera Android – Unresolved reference barcodescanner / BarCodeScannerResult

- **Symptom:** Build fails in "Run gradlew" at task `:expo-camera:compileReleaseKotlin` (and/or `:expo-barcode-scanner:compileReleaseKotlin`) with errors such as:
  - `Unresolved reference 'barcodescanner'`, `Unresolved reference 'BarCodeScannerResult'`
  - `Unresolved reference 'cornerPoints'`, `boundingBox`, `value`, `raw`, `type`, etc.
- **Cause:** expo-camera’s Android barcode code imports `expo.modules.interfaces.barcodescanner.BarCodeScannerResult`. That interface was **removed from expo-modules-core** in Expo PR #34966 (Feb 2025) and moved into expo-camera; **Expo SDK 54** ships before that change, so the interface is missing at build time. Adding expo-barcode-scanner does not fix it (that package also expects the same missing interface).
- **Fix (recommended):** **Do not use expo-camera** for receipt capture. Use **expo-image-picker only**: “Take Photo” = `ImagePicker.launchCameraAsync()`, “Pick from Gallery” = `ImagePicker.launchImageLibraryAsync()`. Both return `{ uri, base64 }`; keep the same preview and “Process” → ReceiptReview → LLM flow. Remove **expo-camera** and **expo-barcode-scanner** from `frontend/package.json`. See `docs/EXPO_CAMERA_ANDROID_BUILD_RESEARCH.md` for full research and references.

### 8.7 Build failure: react-native-screens C++ – ShadowNode::Shared deprecated (RN 0.81)

- **Symptom:** EAS Android build fails at `:app:buildCMakeRelWithDebInfo[arm64-v8a]` with:
  - `RNSScreenShadowNode.h:31:38: error: 'Shared' is deprecated: Use std::shared_ptr<const ShadowNode> instead [-Werror,-Wdeprecated-declarations]`
- **Cause:** React Native 0.81 deprecated `ShadowNode::Shared` in favor of `std::shared_ptr<const ShadowNode>`. react-native-screens 4.12.0 (used with Expo 54) still uses the old type; the build uses `-Werror`, so the deprecation becomes an error.
- **Fix:** A patch is applied via **patch-package**. The repo includes `frontend/patches/react-native-screens+4.12.0.patch` that replaces `ShadowNode::Shared` with `std::shared_ptr<const ShadowNode>` in the C++ files. Ensure `frontend/package.json` has `"postinstall": "patch-package"` and devDependency `"patch-package": "^8.0.0"`. After `npm install` (including on EAS), the patch is applied automatically. Do not remove the `patches` folder or the postinstall script.

### 8.8 Build failure: react-native-safe-area-context C++ – no member named 'unit' in StyleLength (RN 0.81)

- **Symptom:** EAS Android build fails at `:app:buildCMakeRelWithDebInfo[arm64-v8a]` with:
  - `RNCSafeAreaViewShadowNode.cpp:19:12: error: no member named 'unit' in 'facebook::yoga::StyleLength'`
- **Cause:** In React Native 0.81, Yoga’s `StyleLength` no longer has `unit()`; the API uses `isDefined()` instead.
- **Fix:** A patch is applied via **patch-package**. The repo includes `frontend/patches/react-native-safe-area-context+4.14.1.patch` that replaces `edge.unit() != Unit::Undefined` with `edge.isDefined()` (and same for `axis`) in `RNCSafeAreaViewShadowNode.cpp`. The existing `postinstall`: `patch-package` applies this automatically after `npm install`.

### 8.9 Checklist before running EAS production build

- [ ] `frontend/package.json`: `eas-cli` ≥ 16.3.3; `react-native-screens` ~4.12.0; `react-native-safe-area-context` ~4.14.0 (for Expo 54); `patch-package` in devDependencies; `postinstall`: `patch-package`. Do **not** add expo-camera or expo-barcode-scanner (use expo-image-picker only for receipt photo/gallery).
- [ ] `frontend/metro.config.js`: uses `require('expo/metro-config')` and `getDefaultConfig(__dirname)`.
- [ ] First Android production build: answer **Y** to "Generate a new Android Keystore?".
- [ ] Optional: set `cli.version` and `cli.appVersionSource` in `frontend/eas.json` to avoid warnings.

---

## Notes

- **Free tier limits:** Railway/Heroku have free tiers with limitations
- **Database:** Use PostgreSQL in production (not SQLite)
- **CORS:** Make sure backend allows your frontend domain
- **SSL:** Production should use HTTPS (most platforms provide this)
- **Updates:** Use `eas update` for OTA updates without rebuilding

