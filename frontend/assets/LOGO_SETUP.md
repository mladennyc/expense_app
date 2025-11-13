# Logo Setup Guide for KASA

## Required Logo Files

Place your logo files in the `frontend/assets/` folder:

### 1. **icon.png** (App Icon)
- **Size:** 1024x1024 pixels
- **Format:** PNG with transparency
- **Usage:** Main app icon for iOS and Android
- **Design Tips:**
  - Use a simple, recognizable design
  - Keep important elements in the center (corners may be rounded)
  - Use high contrast colors
  - Test on both light and dark backgrounds

### 2. **adaptive-icon.png** (Android Adaptive Icon)
- **Size:** 1024x1024 pixels
- **Format:** PNG with transparency
- **Usage:** Android adaptive icon (foreground only)
- **Design Tips:**
  - Design should work in a circular, square, or rounded square shape
  - Keep important content in the center 66% of the image
  - The outer 33% may be cropped on some devices

### 3. **splash.png** (Splash Screen)
- **Size:** 1242x2436 pixels (or 1284x2778 for newer iPhones)
- **Format:** PNG
- **Usage:** Loading screen when app starts
- **Design Tips:**
  - Center your logo
  - Use your brand colors
  - Keep it simple and clean
  - Background color is set to `#10B981` (teal/green) in `app.json`

### 4. **favicon.png** (Web Favicon)
- **Size:** 48x48 pixels (or 32x32)
- **Format:** PNG or ICO
- **Usage:** Browser tab icon for web version
- **Design Tips:**
  - Simple design that's readable at small sizes
  - Usually just the logo or a simplified version

## Quick Setup Steps

1. **Create your logos** using a design tool (Figma, Canva, Photoshop, etc.)
   - Or use an online logo generator
   - Make sure they match the sizes above

2. **Save them** in the `frontend/assets/` folder with these exact names:
   - `icon.png`
   - `adaptive-icon.png`
   - `splash.png`
   - `favicon.png`

3. **Test the icons:**
   ```bash
   cd frontend
   npm start
   ```
   - Check the app icon in Expo Go
   - Check the splash screen when app loads
   - Check the web favicon in browser tab

## Logo Design Ideas for "KASA"

Since "KASA" means "cash" or "money" in Serbian:
- 💰 Cash/money symbol
- 📊 Chart/graph (expense tracking)
- 🏦 Wallet or bank symbol
- 💳 Credit card
- 📱 Modern minimalist design with "KASA" text
- 🟢 Green/teal color scheme (matches app theme)

## Online Logo Generators

- **Canva:** https://www.canva.com (free, easy to use)
- **LogoMaker:** https://www.logomaker.com
- **Hatchful (Shopify):** https://www.shopify.com/tools/logo-maker
- **Figma:** https://www.figma.com (more advanced, free)

## Temporary Placeholder

If you don't have logos yet, you can:
1. Use a simple text logo with "KASA" in a nice font
2. Use an emoji as a temporary icon (💰)
3. Create a simple colored square with "K" or "KASA" text

## After Adding Logos

1. Restart Expo: `npm start` (or press `r` in terminal)
2. Clear cache if needed: `npx expo start -c`
3. For production builds, logos will be included automatically

## Notes

- **Icon corners:** iOS and Android automatically round icon corners, so don't add rounded corners yourself
- **File size:** Keep PNG files optimized (under 500KB each if possible)
- **Transparency:** Use PNG with alpha channel for icons (not JPG)
- **Testing:** Always test on actual devices, not just simulators

