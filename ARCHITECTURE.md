# Expense App Architecture

## Current State
- ✅ FastAPI backend with SQLite/PostgreSQL database
- ✅ React Native (Expo) frontend (mobile + web)
- ✅ JWT-based authentication
- ✅ Persistent data storage with SQLAlchemy ORM
- ✅ Subscription system with Stripe integration
- ✅ Receipt scanning with OpenAI GPT-4 Turbo
- ✅ In-app notifications system
- ✅ Multi-language support (8 languages)
- ✅ Multi-currency support

## Architecture Overview

### Backend Structure

```
backend/
├── main.py                 # FastAPI app entry point, route registration
├── database.py             # SQLAlchemy models and database initialization
├── auth.py                 # JWT authentication utilities
├── email_service.py        # Email sending service (Brevo SMTP)
├── models.py               # Pydantic request/response models
├── routes/                 # Modular route handlers
│   ├── __init__.py
│   ├── auth.py             # Authentication endpoints (signup, login, password reset)
│   ├── expenses.py         # Expense CRUD operations
│   ├── income.py           # Income CRUD operations
│   ├── stats.py            # Statistics and analytics endpoints
│   ├── receipts.py         # Receipt scanning and processing
│   ├── export.py           # CSV export functionality
│   ├── subscription.py     # Subscription management, Stripe integration, webhooks
│   ├── notifications.py    # In-app notification endpoints
│   └── debug.py            # Debug endpoints (development only)
└── requirements.txt       # Python dependencies
```

### Frontend Structure

```
frontend/
├── App.js                  # Main app component, navigation setup
├── api.js                  # API client functions
├── config.js               # Configuration (API URLs)
├── screens/                # App screens
│   ├── LoginScreen.js
│   ├── DashboardScreen.js
│   ├── AddExpenseScreen.js
│   ├── ReceiptCameraScreen.js
│   ├── ReceiptReviewScreen.js
│   ├── SettingsScreen.js
│   ├── ManageSubscriptionScreen.js
│   ├── NotificationsScreen.js
│   ├── ContactScreen.js
│   └── ...
├── src/                    # Shared components and providers
│   ├── AuthContext.js      # Authentication context
│   ├── LanguageProvider.js # i18n translation system
│   ├── CurrencyProvider.js # Currency conversion
│   ├── NotificationBell.js # Notification badge component
│   └── ...
└── package.json
```

## Database Schema

### Core Tables
- **users**: User accounts (email, password_hash, name, created_at)
- **expenses**: Expense records (user_id, amount, date, category, description, merchant)
- **income**: Income records (user_id, amount, date, source, description)

### Subscription System
- **subscriptions**: User subscription plans (LIMITED, FREE, EXTRA_30, UNLIMITED)
- **receipt_scans**: Scan usage tracking (user_id, month, year, scan_count)
- **promo_codes**: Promo code management (code, type, expires_at, max_uses)

### Notifications
- **notifications**: In-app notifications (user_id, message, type, read, created_at)

## Key Features

### 1. Authentication & Authorization
- JWT token-based authentication
- Password hashing with bcrypt
- Protected API routes
- Token stored in AsyncStorage (frontend)

### 2. Subscription System
- **Free Plan (LIMITED)**: 10 receipt scans per month (default)
- **EXTRA_30**: One-time purchase of 30 additional scans ($0.99)
- **UNLIMITED**: Monthly subscription ($1.99/month)
- **FREE**: Promo code for unlimited access
- Stripe integration for payments
- Webhook handling for subscription events

### 3. Receipt Scanning
- Photo capture/gallery selection
- OpenAI GPT-4 Turbo for OCR and data extraction
- Automatic itemization
- Tax calculation (US-style: tax added on top, Serbia-style: tax included)
- Scan limit enforcement based on subscription plan

### 4. In-App Notifications
- Database-backed notification system
- Real-time unread count badge
- Notification types: payment_failed, subscription_cancelled, etc.
- Mark as read functionality

### 5. Internationalization
- 8 languages: English, Serbian, Spanish, Portuguese, French, German, Italian, Arabic
- Currency conversion support
- Language/currency selectors in header

### 6. Contact Form
- Formspree integration for support messages
- User-controlled success state (replaces form on success)
- Inline error messages

## Technology Stack

### Backend
- **FastAPI**: Modern Python web framework
- **SQLAlchemy**: ORM for database operations
- **SQLite**: Development database
- **PostgreSQL**: Production database (optional)
- **python-jose**: JWT token handling
- **passlib[bcrypt]**: Password hashing
- **stripe**: Payment processing
- **openai**: Receipt OCR and data extraction

### Frontend
- **React Native (Expo)**: Cross-platform mobile/web framework
- **React Navigation**: Screen navigation
- **AsyncStorage**: Local token storage
- **React Native Chart Kit**: Charts and graphs

## Security Considerations
- ✅ Password hashing (bcrypt)
- ✅ JWT token authentication
- ✅ HTTPS in production
- ✅ Input validation
- ✅ CORS configuration
- ✅ Environment variables for secrets
- ✅ Stripe webhook signature verification

## Environment Variables

### Backend (.env)
```
SECRET_KEY=<jwt-secret-key>
DATABASE_URL=sqlite:///./expenses.db  # or PostgreSQL URL
OPENAI_API_KEY=<openai-api-key>
STRIPE_SECRET_KEY=<stripe-secret-key>
STRIPE_PUBLISHABLE_KEY=<stripe-publishable-key>
STRIPE_WEBHOOK_SECRET=<stripe-webhook-secret>
STRIPE_PRICE_ID_EXTRA_30=<price-id>
STRIPE_PRICE_ID_UNLIMITED=<price-id>
SMTP_SERVER=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USERNAME=<brevo-username>
SMTP_PASSWORD=<brevo-password>
SENDER_EMAIL=<sender-email>
BASE_URL=<frontend-url>
```

### Frontend (config.js)
```javascript
export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
```

## Development Workflow

1. **Backend**: `cd backend && uvicorn main:app --reload --host 0.0.0.0 --port 8000`
2. **Frontend**: `cd frontend && npm start`
3. **Database**: SQLite file created automatically on first run
4. **Stripe Webhooks (local)**: Use Stripe CLI for local webhook forwarding

## Deployment

- **Backend**: Railway, Render, or Fly.io
- **Frontend Web**: Vercel, Netlify, or Expo hosting
- **Mobile Apps**: EAS Build (Expo Application Services)

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.
