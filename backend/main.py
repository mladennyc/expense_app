from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, field_validator, EmailStr
from typing import List, Optional
from datetime import datetime, date, timedelta
from collections import defaultdict
from sqlalchemy.orm import Session
import os

from database import get_db, init_db, User, Expense as ExpenseModel, Income as IncomeModel
from auth import (
    get_password_hash, verify_password, create_access_token,
    get_current_user, ACCESS_TOKEN_EXPIRE_MINUTES
)
from email_service import send_password_reset_email
import secrets
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = FastAPI()

# Initialize database on startup
@app.on_event("startup")
def on_startup():
    init_db()

# Add CORS middleware
# When allow_credentials=True, you cannot use allow_origins=["*"]
# Must specify exact origins
allowed_origins = [
    "https://my-kasa-app.vercel.app",
    "http://localhost:8081",
    "http://localhost:19006",
    "http://127.0.0.1:8081",
    "http://127.0.0.1:19006",
    "http://192.168.1.76:8081",
    "http://192.168.1.76:19006",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With"],
    expose_headers=["*"],
    max_age=3600,  # Cache preflight requests for 1 hour
)


# Pydantic models
class UserSignup(BaseModel):
    email: EmailStr
    username: Optional[str] = None
    password: str
    name: str

    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters')
        return v
    
    @field_validator('username')
    @classmethod
    def validate_username(cls, v):
        if v is not None:
            v = v.strip()
            if len(v) < 3:
                raise ValueError('Username must be at least 3 characters')
            if not v.replace('_', '').replace('-', '').isalnum():
                raise ValueError('Username can only contain letters, numbers, underscores, and hyphens')
        return v


class UserResponse(BaseModel):
    id: int
    email: str
    username: Optional[str] = None
    name: str

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


class ExpenseIn(BaseModel):
    amount: float
    date: date
    category: Optional[str] = None
    description: Optional[str] = None

    @field_validator('amount')
    @classmethod
    def validate_amount(cls, v):
        if v <= 0:
            raise ValueError('Amount must be greater than 0')
        return v


class Expense(BaseModel):
    id: int
    amount: float
    date: date
    category: Optional[str] = None
    description: Optional[str] = None

    class Config:
        from_attributes = True


class IncomeIn(BaseModel):
    amount: float
    date: date
    category: Optional[str] = None
    description: Optional[str] = None

    @field_validator('amount')
    @classmethod
    def validate_amount(cls, v):
        if v <= 0:
            raise ValueError('Amount must be greater than 0')
        return v


class Income(BaseModel):
    id: int
    amount: float
    date: date
    category: Optional[str] = None
    description: Optional[str] = None

    class Config:
        from_attributes = True


@app.get("/")
@app.head("/")
def read_root():
    return {"status": "ok", "message": "backend is running"}


@app.get("/health")
@app.head("/health")
async def health_check():
    return {"status": "ok"}


@app.get("/debug/db-stats")
async def get_db_stats(db: Session = Depends(get_db)):
    """Debug endpoint to check database contents (for troubleshooting)"""
    from sqlalchemy import text, inspect
    import os
    
    # Get database connection info (masked)
    db_url = os.getenv("DATABASE_URL", "Not set")
    if db_url != "Not set" and "@" in db_url:
        # Mask password in URL
        parts = db_url.split("@")
        if len(parts) == 2:
            masked_url = "postgresql://***@" + parts[1]
        else:
            masked_url = "***"
    else:
        masked_url = db_url
    
    # Check if tables exist using raw SQL
    inspector = inspect(db.bind)
    all_tables = inspector.get_table_names()
    
    # Try to query counts (will fail if tables don't exist)
    result = {
        "database_url_masked": masked_url,
        "tables_found": all_tables,
        "expected_tables": ["users", "expenses", "incomes"],
        "tables_exist": {
            "users": "users" in all_tables,
            "expenses": "expenses" in all_tables,
            "incomes": "incomes" in all_tables
        }
    }
    
    # Try to get counts if tables exist
    if "users" in all_tables:
        try:
            user_count = db.query(User).count()
            result["user_count"] = user_count
            
            if user_count > 0:
                users = db.query(User).order_by(User.created_at.desc()).limit(5).all()
                result["recent_users"] = [
                    {
                        "id": u.id,
                        "email": u.email,
                        "username": u.username,
                        "name": u.name,
                        "created_at": str(u.created_at)
                    }
                    for u in users
                ]
        except Exception as e:
            result["user_count_error"] = str(e)
    
    if "expenses" in all_tables:
        try:
            result["expense_count"] = db.query(ExpenseModel).count()
        except Exception as e:
            result["expense_count_error"] = str(e)
    
    if "incomes" in all_tables:
        try:
            result["income_count"] = db.query(IncomeModel).count()
        except Exception as e:
            result["income_count_error"] = str(e)
    
    return result


# Authentication endpoints
@app.post("/signup", response_model=Token)
async def signup(user_data: UserSignup, db: Session = Depends(get_db)):
    """Create a new user account"""
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Check if username already exists (if provided)
    if user_data.username:
        existing_username = db.query(User).filter(User.username == user_data.username).first()
        if existing_username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        username=user_data.username,
        password_hash=hashed_password,
        name=user_data.name
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create access token - ensure sub is a string
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    user_id_str = str(int(new_user.id))  # Explicitly convert to int then string
    access_token = create_access_token(
        data={"sub": user_id_str}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse(id=new_user.id, email=new_user.email, username=new_user.username, name=new_user.name)
    }


@app.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Login and get access token - accepts email or username"""
    # Try to find user by email or username
    # OAuth2PasswordRequestForm uses 'username' field, but we accept either email or username
    login_identifier = form_data.username
    
    # Try email first
    user = db.query(User).filter(User.email == login_identifier).first()
    
    # If not found by email, try username
    if not user:
        user = db.query(User).filter(User.username == login_identifier).first()
    
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email/username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token - ensure sub is a string
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    user_id_str = str(int(user.id))  # Explicitly convert to int then string
    access_token = create_access_token(
        data={"sub": user_id_str}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse(id=user.id, email=user.email, username=user.username, name=user.name)
    }


@app.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    return UserResponse(
        id=current_user.id, 
        email=current_user.email, 
        username=current_user.username,
        name=current_user.name
    )


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str


@app.put("/me/password")
async def change_password(
    password_data: PasswordChangeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change user password"""
    from backend.auth import verify_password, get_password_hash
    
    # Verify current password
    if not verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid current password"
        )
    
    # Validate new password
    if len(password_data.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters long"
        )
    
    # Update password
    current_user.hashed_password = get_password_hash(password_data.new_password)
    db.commit()
    
    return {"message": "Password changed successfully"}


@app.delete("/me")
async def delete_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete user account and all associated data"""
    # Delete all expenses for this user
    db.query(ExpenseModel).filter(ExpenseModel.user_id == current_user.id).delete()
    
    # Delete the user
    db.delete(current_user)
    db.commit()
    
    return {"message": "Account deleted successfully"}


@app.post("/check-email")
async def check_email(email: str, db: Session = Depends(get_db)):
    """Check if an email is already registered"""
    user = db.query(User).filter(User.email == email).first()
    return {"exists": user is not None}


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordReset(BaseModel):
    token: str
    new_password: str


@app.post("/reset-password-request")
async def reset_password_request(
    request: PasswordResetRequest,
    db: Session = Depends(get_db)
):
    """Request password reset - sends email with reset token"""
    user = db.query(User).filter(User.email == request.email).first()
    
    # Always return success (don't reveal if email exists)
    if not user:
        return {"message": "If an account exists with this email, password reset instructions have been sent."}
    
    # Generate reset token
    reset_token = secrets.token_urlsafe(32)
    reset_token_expires = datetime.utcnow() + timedelta(hours=1)
    
    # Save token to user
    user.reset_token = reset_token
    user.reset_token_expires = reset_token_expires
    db.commit()
    
    # Send email
    base_url = os.getenv("BASE_URL", "http://localhost:8000")
    send_password_reset_email(user.email, reset_token, base_url)
    
    return {"message": "If an account exists with this email, password reset instructions have been sent."}


@app.post("/reset-password")
async def reset_password(
    reset_data: PasswordReset,
    db: Session = Depends(get_db)
):
    """Reset password using token"""
    # Find user by reset token
    user = db.query(User).filter(
        User.reset_token == reset_data.token,
        User.reset_token_expires > datetime.utcnow()
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    # Validate password
    if len(reset_data.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters"
        )
    
    # Update password
    user.password_hash = get_password_hash(reset_data.new_password)
    user.reset_token = None
    user.reset_token_expires = None
    db.commit()
    
    return {"message": "Password has been reset successfully"}


# Expense endpoints (protected)
@app.post("/expenses", response_model=Expense)
async def create_expense(
    expense: ExpenseIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new expense (requires authentication)"""
    db_expense = ExpenseModel(
        user_id=current_user.id,
        amount=expense.amount,
        date=expense.date,
        category=expense.category,
        description=expense.description
    )
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    
    return Expense(
        id=db_expense.id,
        amount=db_expense.amount,
        date=db_expense.date,
        category=db_expense.category,
        description=db_expense.description
    )


@app.get("/expenses/recent", response_model=List[Expense])
async def get_recent_expenses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get the last 10 expenses for current user sorted by date descending"""
    expenses = db.query(ExpenseModel).filter(
        ExpenseModel.user_id == current_user.id
    ).order_by(ExpenseModel.date.desc()).limit(10).all()
    
    return [
        Expense(
            id=e.id,
            amount=e.amount,
            date=e.date,
            category=e.category,
            description=e.description
        )
        for e in expenses
    ]


@app.get("/stats/current-month")
async def get_current_month_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get total expenses for the last 6 months for current user"""
    current_date = datetime.now().date()
    months_data = []
    
    # Get last 6 months including current month
    for i in range(6):
        if i == 0:
            # Current month (partial)
            month_start = date(current_date.year, current_date.month, 1)
            month_end = current_date
            month_key = current_date.strftime("%Y-%m")
        else:
            # Previous months (full month)
            if current_date.month - i <= 0:
                year = current_date.year - 1
                month = current_date.month - i + 12
            else:
                year = current_date.year
                month = current_date.month - i
            
            month_start = date(year, month, 1)
            # Get last day of month
            if month == 12:
                month_end = date(year + 1, 1, 1) - timedelta(days=1)
            else:
                month_end = date(year, month + 1, 1) - timedelta(days=1)
            month_key = month_start.strftime("%Y-%m")
        
        expenses = db.query(ExpenseModel).filter(
            ExpenseModel.user_id == current_user.id,
            ExpenseModel.date >= month_start,
            ExpenseModel.date <= month_end
        ).all()
        
        total = sum(expense.amount for expense in expenses)
        months_data.append({
            "month": month_key,
            "total": total,
            "isCurrent": i == 0
        })
    
    # Reverse to show oldest first
    months_data.reverse()
    
    return {
        "months": months_data,
        "current": months_data[-1] if months_data else None
    }


@app.get("/stats/current-month-by-category")
async def get_current_month_by_category(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get expenses grouped by category for the current month (backward compatibility)"""
    current_date = datetime.now().date()
    month_start = date(current_date.year, current_date.month, 1)
    month_end = current_date
    month = current_date.strftime("%Y-%m")
    
    expenses = db.query(ExpenseModel).filter(
        ExpenseModel.user_id == current_user.id,
        ExpenseModel.date >= month_start,
        ExpenseModel.date <= month_end
    ).all()
    
    # Group by category
    category_totals = defaultdict(float)
    category_counts = defaultdict(int)
    
    for expense in expenses:
        category = expense.category or "Uncategorized"
        category_totals[category] += expense.amount
        category_counts[category] += 1
    
    total = sum(category_totals.values())
    
    # Convert to list of dicts with percentage
    result = []
    for category, amount in sorted(category_totals.items(), key=lambda x: x[1], reverse=True):
        percentage = (amount / total * 100) if total > 0 else 0
        result.append({
            "category": category,
            "amount": amount,
            "count": category_counts[category],
            "percentage": round(percentage, 1)
        })
    
    return {
        "month": month,
        "total": total,
        "categories": result
    }


@app.get("/stats/month-by-category")
async def get_month_by_category(
    month: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get expenses grouped by category for a specific month (YYYY-MM format). If no month provided, uses current month."""
    current_date = datetime.now().date()
    
    if month:
        # Parse provided month
        try:
            year, month_num = map(int, month.split('-'))
            month_start = date(year, month_num, 1)
            # Get last day of month
            if month_num == 12:
                month_end = date(year + 1, 1, 1) - timedelta(days=1)
            else:
                month_end = date(year, month_num + 1, 1) - timedelta(days=1)
            # For current month, limit to today
            if month == current_date.strftime("%Y-%m"):
                month_end = current_date
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid month format. Use YYYY-MM")
    else:
        # Default to current month
        month_start = date(current_date.year, current_date.month, 1)
        month_end = current_date
        month = current_date.strftime("%Y-%m")
    
    expenses = db.query(ExpenseModel).filter(
        ExpenseModel.user_id == current_user.id,
        ExpenseModel.date >= month_start,
        ExpenseModel.date <= month_end
    ).all()
    
    # Group by category
    category_totals = defaultdict(float)
    category_counts = defaultdict(int)
    
    for expense in expenses:
        category = expense.category or "Uncategorized"
        category_totals[category] += expense.amount
        category_counts[category] += 1
    
    total = sum(category_totals.values())
    
    # Convert to list of dicts with percentage
    result = []
    for category, amount in sorted(category_totals.items(), key=lambda x: x[1], reverse=True):
        percentage = (amount / total * 100) if total > 0 else 0
        result.append({
            "category": category,
            "amount": amount,
            "count": category_counts[category],
            "percentage": round(percentage, 1)
        })
    
    return {
        "month": month,
        "total": total,
        "categories": result
    }


@app.get("/expenses/{expense_id}", response_model=Expense)
async def get_expense(
    expense_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific expense by ID (requires authentication)"""
    expense = db.query(ExpenseModel).filter(
        ExpenseModel.id == expense_id,
        ExpenseModel.user_id == current_user.id
    ).first()
    
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found"
        )
    
    return Expense(
        id=expense.id,
        amount=expense.amount,
        date=expense.date,
        category=expense.category,
        description=expense.description
    )


@app.put("/expenses/{expense_id}", response_model=Expense)
async def update_expense(
    expense_id: int,
    expense: ExpenseIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update an existing expense (requires authentication)"""
    db_expense = db.query(ExpenseModel).filter(
        ExpenseModel.id == expense_id,
        ExpenseModel.user_id == current_user.id
    ).first()
    
    if not db_expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found"
        )
    
    # Update expense fields
    db_expense.amount = expense.amount
    db_expense.date = expense.date
    db_expense.category = expense.category
    db_expense.description = expense.description
    
    db.commit()
    db.refresh(db_expense)
    
    return Expense(
        id=db_expense.id,
        amount=db_expense.amount,
        date=db_expense.date,
        category=db_expense.category,
        description=db_expense.description
    )


@app.delete("/expenses/{expense_id}")
async def delete_expense(
    expense_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an expense (requires authentication)"""
    db_expense = db.query(ExpenseModel).filter(
        ExpenseModel.id == expense_id,
        ExpenseModel.user_id == current_user.id
    ).first()
    
    if not db_expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found"
        )
    
    db.delete(db_expense)
    db.commit()
    
    return {"message": "Expense deleted successfully"}


@app.get("/stats/by-month")
async def get_stats_by_month(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get totals grouped by YYYY-MM for current user, sorted by month"""
    expenses = db.query(ExpenseModel).filter(
        ExpenseModel.user_id == current_user.id
    ).all()
    
    monthly_totals = defaultdict(float)
    for expense in expenses:
        month_key = expense.date.strftime("%Y-%m")
        monthly_totals[month_key] += expense.amount
    
    result = [
        {"month": month, "total": total}
        for month, total in sorted(monthly_totals.items(), reverse=True)
    ]
    return result


# Income endpoints (protected)
@app.post("/income", response_model=Income)
async def create_income(
    income: IncomeIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new income entry (requires authentication)"""
    db_income = IncomeModel(
        user_id=current_user.id,
        amount=income.amount,
        date=income.date,
        category=income.category,
        description=income.description
    )
    db.add(db_income)
    db.commit()
    db.refresh(db_income)
    
    return Income(
        id=db_income.id,
        amount=db_income.amount,
        date=db_income.date,
        category=db_income.category,
        description=db_income.description
    )


@app.get("/income/recent", response_model=List[Income])
async def get_recent_income(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get the last 10 income entries for current user sorted by date descending"""
    incomes = db.query(IncomeModel).filter(
        IncomeModel.user_id == current_user.id
    ).order_by(IncomeModel.date.desc()).limit(10).all()
    
    return [
        Income(
            id=i.id,
            amount=i.amount,
            date=i.date,
            category=i.category,
            description=i.description
        )
        for i in incomes
    ]


@app.get("/income/{income_id}", response_model=Income)
async def get_income(
    income_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific income entry by ID (requires authentication)"""
    income = db.query(IncomeModel).filter(
        IncomeModel.id == income_id,
        IncomeModel.user_id == current_user.id
    ).first()
    
    if not income:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Income not found"
        )
    
    return Income(
        id=income.id,
        amount=income.amount,
        date=income.date,
        category=income.category,
        description=income.description
    )


@app.put("/income/{income_id}", response_model=Income)
async def update_income(
    income_id: int,
    income: IncomeIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update an existing income entry (requires authentication)"""
    db_income = db.query(IncomeModel).filter(
        IncomeModel.id == income_id,
        IncomeModel.user_id == current_user.id
    ).first()
    
    if not db_income:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Income not found"
        )
    
    # Update income fields
    db_income.amount = income.amount
    db_income.date = income.date
    db_income.category = income.category
    db_income.description = income.description
    
    db.commit()
    db.refresh(db_income)
    
    return Income(
        id=db_income.id,
        amount=db_income.amount,
        date=db_income.date,
        category=db_income.category,
        description=db_income.description
    )


@app.delete("/income/{income_id}")
async def delete_income(
    income_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an income entry (requires authentication)"""
    db_income = db.query(IncomeModel).filter(
        IncomeModel.id == income_id,
        IncomeModel.user_id == current_user.id
    ).first()
    
    if not db_income:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Income not found"
        )
    
    db.delete(db_income)
    db.commit()
    
    return {"message": "Income deleted successfully"}


@app.get("/stats/income/current-month")
async def get_current_month_income_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get total income for the last 6 months for current user"""
    current_date = datetime.now().date()
    months_data = []
    
    # Get last 6 months including current month
    for i in range(6):
        if i == 0:
            # Current month (partial)
            month_start = date(current_date.year, current_date.month, 1)
            month_end = current_date
            month_key = current_date.strftime("%Y-%m")
        else:
            # Previous months (full month)
            if current_date.month - i <= 0:
                year = current_date.year - 1
                month = current_date.month - i + 12
            else:
                year = current_date.year
                month = current_date.month - i
            
            month_start = date(year, month, 1)
            # Get last day of month
            if month == 12:
                month_end = date(year + 1, 1, 1) - timedelta(days=1)
            else:
                month_end = date(year, month + 1, 1) - timedelta(days=1)
            month_key = month_start.strftime("%Y-%m")
        
        incomes = db.query(IncomeModel).filter(
            IncomeModel.user_id == current_user.id,
            IncomeModel.date >= month_start,
            IncomeModel.date <= month_end
        ).all()
        
        total = sum(income.amount for income in incomes)
        months_data.append({
            "month": month_key,
            "total": total,
            "isCurrent": i == 0
        })
    
    # Reverse to show oldest first
    months_data.reverse()
    
    return {
        "months": months_data,
        "current": months_data[-1] if months_data else None
    }


@app.get("/stats/income/by-month")
async def get_income_by_month(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get income totals grouped by YYYY-MM for current user, sorted by month"""
    incomes = db.query(IncomeModel).filter(
        IncomeModel.user_id == current_user.id
    ).all()
    
    monthly_totals = defaultdict(float)
    for income in incomes:
        month_key = income.date.strftime("%Y-%m")
        monthly_totals[month_key] += income.amount
    
    result = [
        {"month": month, "total": total}
        for month, total in sorted(monthly_totals.items(), reverse=True)
    ]
    return result


@app.get("/stats/net-income")
async def get_net_income(
    month: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get net income (income - expenses) for a specific month. If no month provided, uses current month."""
    current_date = datetime.now().date()
    
    if month:
        # Parse provided month
        try:
            year, month_num = map(int, month.split('-'))
            month_start = date(year, month_num, 1)
            # Get last day of month
            if month_num == 12:
                month_end = date(year + 1, 1, 1) - timedelta(days=1)
            else:
                month_end = date(year, month_num + 1, 1) - timedelta(days=1)
            # For current month, limit to today
            if month == current_date.strftime("%Y-%m"):
                month_end = current_date
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid month format. Use YYYY-MM")
    else:
        # Default to current month
        month_start = date(current_date.year, current_date.month, 1)
        month_end = current_date
        month = current_date.strftime("%Y-%m")
    
    # Get income for the month
    incomes = db.query(IncomeModel).filter(
        IncomeModel.user_id == current_user.id,
        IncomeModel.date >= month_start,
        IncomeModel.date <= month_end
    ).all()
    total_income = sum(income.amount for income in incomes)
    
    # Get expenses for the month
    expenses = db.query(ExpenseModel).filter(
        ExpenseModel.user_id == current_user.id,
        ExpenseModel.date >= month_start,
        ExpenseModel.date <= month_end
    ).all()
    total_expenses = sum(expense.amount for expense in expenses)
    
    net_income = total_income - total_expenses
    
    return {
        "month": month,
        "income": total_income,
        "expenses": total_expenses,
        "net": net_income
    }


# Receipt scanning endpoint - accepts base64 JSON
class ReceiptScanRequest(BaseModel):
    image_base64: str

@app.post("/receipts/scan")
async def scan_receipt(
    request: ReceiptScanRequest,
    current_user: User = Depends(get_current_user)
):
    """Scan receipt image using GPT-4 Turbo and extract expense data"""
    from openai import OpenAI
    import base64
    import json
    
    # Your app's category list
    CATEGORIES = [
        "Groceries", "Utilities", "Transportation", "Housing",
        "Healthcare", "Education", "Entertainment", "Dining Out",
        "Clothing", "Personal Care", "Gifts & Donations", "Travel",
        "Loans & Debt Payments", "Bank Fees", "Insurance", "Taxes", "Other"
    ]
    
    try:
        # Get base64 from request
        image_base64 = request.image_base64
        if not image_base64:
            raise HTTPException(status_code=400, detail="No image data provided")
        
        # Remove data URL prefix if present
        if ',' in image_base64:
            image_base64 = image_base64.split(',')[1]
        
        print(f"Receipt scan request received, image size: {len(image_base64)} chars")
        
        # Initialize OpenAI client
        openai_api_key = os.getenv("OPENAI_API_KEY")
        if not openai_api_key:
            print("ERROR: OPENAI_API_KEY not set")
            raise HTTPException(
                status_code=500,
                detail="OpenAI API key not configured. Please set OPENAI_API_KEY environment variable."
            )
        
        print(f"OpenAI API key found, length: {len(openai_api_key)}")
        client = OpenAI(api_key=openai_api_key)
        
        # Create prompt with categories
        prompt = f"""Extract expense data from this receipt image and return JSON with:
- amount: numeric value only (float), extract the total amount
- date: YYYY-MM-DD format (extract from receipt, use today's date {datetime.now().date()} if not found)
- merchant: store/company name (string, extract from receipt)
- category: MUST match one of these exactly: {', '.join(CATEGORIES)}. Choose the best match based on merchant name and items purchased. If uncertain, use "Other".
- description: brief description of purchase (optional, can be null)

Return ONLY valid JSON, no other text. Example:
{{"amount": 45.99, "date": "2024-01-15", "merchant": "Walmart", "category": "Groceries", "description": "Grocery shopping"}}"""

        # Call GPT-4 Turbo with vision
        print("Calling OpenAI API...")
        try:
            response = client.chat.completions.create(
                model="gpt-4o",  # Using gpt-4o which is more available
                messages=[{
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_base64}"}}
                    ]
                }],
                response_format={"type": "json_object"},
                max_tokens=500
            )
            print("OpenAI API call successful")
            
            # Log token usage and cost
            if hasattr(response, 'usage') and response.usage:
                usage = response.usage
                prompt_tokens = usage.prompt_tokens if hasattr(usage, 'prompt_tokens') else 0
                completion_tokens = usage.completion_tokens if hasattr(usage, 'completion_tokens') else 0
                total_tokens = usage.total_tokens if hasattr(usage, 'total_tokens') else 0
                
                # GPT-4o pricing (as of 2024): $2.50 per 1M input tokens, $10.00 per 1M output tokens
                input_cost_per_1k = 0.0025  # $2.50 per 1M = $0.0025 per 1K
                output_cost_per_1k = 0.01   # $10.00 per 1M = $0.01 per 1K
                
                input_cost = (prompt_tokens / 1000) * input_cost_per_1k
                output_cost = (completion_tokens / 1000) * output_cost_per_1k
                total_cost = input_cost + output_cost
                
                print(f"OpenAI Usage - Prompt tokens: {prompt_tokens}, Completion tokens: {completion_tokens}, Total: {total_tokens}")
                print(f"OpenAI Cost - Input: ${input_cost:.6f}, Output: ${output_cost:.6f}, Total: ${total_cost:.6f}")
            else:
                print("OpenAI Usage: No usage data available")
        except Exception as api_error:
            print(f"OpenAI API error: {str(api_error)}")
            raise HTTPException(
                status_code=500,
                detail=f"OpenAI API error: {str(api_error)}"
            )
        
        # Parse response
        try:
            result = json.loads(response.choices[0].message.content)
            print(f"Parsed result: {result}")
        except json.JSONDecodeError as parse_error:
            print(f"Failed to parse JSON: {response.choices[0].message.content}")
            raise
        
        # Validate and clean up result
        extracted_data = {
            "amount": result.get("amount"),
            "date": result.get("date"),
            "merchant": result.get("merchant"),
            "category": result.get("category"),
            "description": result.get("description")
        }
        
        print(f"Raw extracted data from OpenAI: {extracted_data}")
        
        # Validate category is in list
        if extracted_data["category"] and extracted_data["category"] not in CATEGORIES:
            print(f"Category '{extracted_data['category']}' not in list, setting to None")
            extracted_data["category"] = None
        
        # Validate amount
        if extracted_data["amount"]:
            try:
                extracted_data["amount"] = float(extracted_data["amount"])
            except (ValueError, TypeError):
                print(f"Invalid amount: {extracted_data['amount']}")
                extracted_data["amount"] = None
        else:
            print("No amount extracted")
        
        # Validate date format - always provide a date
        if extracted_data["date"]:
            try:
                # Try to parse date
                datetime.strptime(extracted_data["date"], "%Y-%m-%d")
            except (ValueError, TypeError):
                # Use today if invalid
                print(f"Invalid date format: {extracted_data['date']}, using today")
                extracted_data["date"] = datetime.now().date().isoformat()
        else:
            # If no date, use today
            extracted_data["date"] = datetime.now().date().isoformat()
            print("No date extracted, using today")
        
        print(f"Final extracted data: {extracted_data}")
        
        return {
            "success": True,
            "data": extracted_data,
            "confidence": "high"  # GPT-4 Turbo is generally reliable
        }
        
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to parse OCR response: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing receipt: {str(e)}"
        )
