# KASA - Expense Tracking App

A full-stack expense tracking application with a FastAPI backend and a React Native (Expo) mobile app frontend.

## Features

- ✅ User authentication (email/password)
- ✅ Expense and income tracking with categories
- ✅ Monthly statistics and charts
- ✅ Category breakdown analysis
- ✅ Receipt scanning with AI-powered OCR (OpenAI GPT-4 Turbo)
- ✅ Automatic receipt itemization and tax calculation
- ✅ Subscription system with Stripe integration
  - Free: 10 receipt scans/month
  - Extra 30 scans: $0.99 one-time
  - Unlimited: $1.99/month
- ✅ In-app notifications system
- ✅ Multi-language support (8 languages: English, Serbian, Spanish, Portuguese, French, German, Italian, Arabic)
- ✅ Multi-currency support
- ✅ Password reset via email
- ✅ Contact/support form
- ✅ CSV export functionality
- ✅ Responsive web and mobile app

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
├── backend/              # FastAPI backend
│   ├── main.py          # FastAPI app entry point
│   ├── database.py      # SQLAlchemy models and DB initialization
│   ├── auth.py          # JWT authentication utilities
│   ├── email_service.py  # Email sending (Brevo SMTP)
│   ├── models.py        # Pydantic request/response models
│   ├── routes/          # Modular route handlers
│   │   ├── auth.py      # Authentication endpoints
│   │   ├── expenses.py  # Expense CRUD
│   │   ├── income.py    # Income CRUD
│   │   ├── stats.py     # Statistics endpoints
│   │   ├── receipts.py  # Receipt scanning
│   │   ├── export.py    # CSV export
│   │   ├── subscription.py # Stripe subscriptions & webhooks
│   │   ├── notifications.py # In-app notifications
│   │   └── debug.py     # Debug endpoints
│   └── requirements.txt
├── frontend/             # React Native Expo app
│   ├── screens/         # App screens
│   ├── src/             # Components, providers, utilities
│   ├── App.js           # Main app component & navigation
│   ├── api.js           # API client functions
│   └── package.json
└── README.md
```

## Environment Variables

### Backend (.env)
- `SECRET_KEY` - JWT secret key
- `DATABASE_URL` - Database connection string (SQLite or PostgreSQL)
- `OPENAI_API_KEY` - OpenAI API key for receipt scanning
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret
- `STRIPE_PRICE_ID_EXTRA_30` - Stripe price ID for extra 30 scans
- `STRIPE_PRICE_ID_UNLIMITED` - Stripe price ID for unlimited plan
- `SMTP_SERVER` - Email server (e.g., smtp-relay.brevo.com)
- `SMTP_PORT` - Email port (usually 587)
- `SMTP_USERNAME` - Email username
- `SMTP_PASSWORD` - Email password/app password
- `SENDER_EMAIL` - From email address
- `BASE_URL` - Frontend URL (for password reset links)

### Frontend (config.js)
- `EXPO_PUBLIC_API_URL` - Backend API URL

See [backend/EMAIL_SETUP.md](./backend/EMAIL_SETUP.md) for email configuration details.
See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed architecture documentation.
