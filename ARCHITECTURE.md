# Expense App Architecture Plan

## Current State
- FastAPI backend with in-memory storage
- React Native (Expo) frontend
- No authentication
- No persistent data storage

## Recommended Implementation Plan

### Phase 1: Database & Authentication (Current Priority)

#### Database: SQLite → PostgreSQL
- **Start with SQLite** (simple, file-based, no setup needed)
- **Migrate to PostgreSQL** when deploying (better for production)

#### Authentication Flow
1. **First page**: Sign In / Sign Up screen
2. **JWT tokens** for session management
3. **Password hashing** with bcrypt
4. **Protected routes** - require authentication

#### Database Schema
```sql
Users:
- id (primary key)
- email (unique)
- password_hash
- name
- created_at

Expenses:
- id (primary key)
- user_id (foreign key → Users)
- amount
- date
- category
- description
- created_at
```

### Phase 2: Multi-User Support
- Each user sees only their expenses
- Family members can have separate accounts
- Future: shared family groups/categories

### Phase 3: Deployment

#### Backend Hosting Options:
1. **Railway** (Recommended)
   - Easy setup
   - Free tier available
   - Automatic deployments from GitHub
   - Built-in PostgreSQL

2. **Render**
   - Free tier
   - Easy PostgreSQL setup
   - Auto-deploy from GitHub

3. **Fly.io**
   - Good for global distribution
   - Free tier

#### Frontend Hosting:
- **Expo**: Free hosting for mobile apps
- **Vercel/Netlify**: For web version

#### Deployment Steps:
1. Push code to GitHub
2. Connect Railway/Render to GitHub repo
3. Set environment variables
4. Deploy backend
5. Update frontend BASE_URL to production URL
6. Deploy frontend via Expo

### Technology Stack

**Backend:**
- FastAPI
- SQLAlchemy (ORM)
- SQLite (dev) → PostgreSQL (prod)
- python-jose (JWT tokens)
- passlib[bcrypt] (password hashing)
- alembic (database migrations)

**Frontend:**
- React Native (Expo)
- AsyncStorage (local token storage)
- React Navigation

### Security Considerations
- Hash passwords (never store plain text)
- Use HTTPS in production
- Validate all inputs
- Rate limiting for auth endpoints
- CORS configuration for production

### Next Steps
1. ✅ Add SQLite database with SQLAlchemy
2. ✅ Create User and Expense models
3. ✅ Add authentication endpoints (signup, login)
4. ✅ Add JWT token generation
5. ✅ Protect expense endpoints (require auth)
6. ✅ Update frontend with login screen
7. ✅ Store JWT token in AsyncStorage
8. ✅ Add token to API requests

