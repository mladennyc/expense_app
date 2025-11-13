# KASA - Expense Tracking App

A full-stack expense tracking application with a FastAPI backend and a React Native (Expo) mobile app frontend.

## Features

- User authentication (email/password, optional username)
- Expense tracking with categories
- Monthly statistics and charts
- Category breakdown analysis
- Multi-language support (English, Serbian)
- Multi-currency support
- Password reset via email
- Responsive web and mobile app

## Quick Start

### Backend Setup

1. `cd backend`
2. `python -m venv .venv`
3. `.venv\Scripts\activate` (Windows) or `source .venv/bin/activate` (Mac/Linux)
4. `pip install -r requirements.txt`
5. `uvicorn main:app --host 0.0.0.0 --port 8000`

**Note:** The `--host 0.0.0.0` flag is needed so a phone can reach the backend server over the network.

### Frontend Setup

1. `cd frontend`
2. `npm install`
3. Update `config.js` with your backend URL
4. `npm start`

### Development

- **Backend:** http://localhost:8000
- **Frontend Web:** http://localhost:8081
- **Expo Go:** Scan QR code with Expo Go app

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions on:
- GitHub setup
- Web deployment (Vercel, Netlify, Expo)
- Android app build (EAS Build)
- Production configuration

## Project Structure

```
expense_app/
├── backend/          # FastAPI backend
│   ├── main.py      # API routes
│   ├── database.py  # SQLAlchemy models
│   ├── auth.py      # Authentication utilities
│   └── requirements.txt
├── frontend/         # React Native Expo app
│   ├── screens/     # App screens
│   ├── src/         # Components, providers, utilities
│   ├── App.js       # Main app component
│   └── package.json
└── README.md
```

## Environment Variables

### Backend
- `SMTP_SERVER` - Email server for password reset
- `SMTP_PORT` - Email port (usually 587)
- `SMTP_USERNAME` - Email username
- `SMTP_PASSWORD` - Email password/app password
- `SENDER_EMAIL` - From email address
- `BASE_URL` - Frontend URL (for password reset links)
- `SECRET_KEY` - JWT secret key

### Frontend
- `EXPO_PUBLIC_API_URL` - Backend API URL

See [backend/EMAIL_SETUP.md](./backend/EMAIL_SETUP.md) for email configuration details.
