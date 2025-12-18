from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import secrets
import os

from database import get_db, User, Expense as ExpenseModel
from auth import (
    get_password_hash, verify_password, create_access_token,
    get_current_user, ACCESS_TOKEN_EXPIRE_MINUTES
)
from email_service import send_password_reset_email
from models import (
    UserSignup, UserResponse, Token, PasswordChangeRequest,
    PasswordResetRequest, PasswordReset
)

router = APIRouter()


@router.post("/signup", response_model=Token)
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


@router.post("/login", response_model=Token)
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


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    return UserResponse(
        id=current_user.id, 
        email=current_user.email, 
        username=current_user.username,
        name=current_user.name
    )


@router.put("/me/password")
async def change_password(
    password_data: PasswordChangeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change user password"""
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


@router.delete("/me")
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


@router.post("/check-email")
async def check_email(email: str, db: Session = Depends(get_db)):
    """Check if an email is already registered"""
    user = db.query(User).filter(User.email == email).first()
    return {"exists": user is not None}


@router.post("/reset-password-request")
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


@router.post("/reset-password")
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



