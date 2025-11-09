from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from database import get_db, User

# Secret key for JWT (in production, use environment variable)
SECRET_KEY = "your-secret-key-change-this-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30 * 24 * 60  # 30 days

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create a JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """Get the current authenticated user"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    print(f"Received token: {token[:20] if token else 'None'}...")
    
    if not token:
        print("ERROR: No token provided")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No token provided",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        print(f"JWT decoded successfully. Payload: {payload}")
        user_id_str = payload.get("sub")
        if user_id_str is None:
            print("ERROR: No user_id in token payload")
            raise credentials_exception
        # Check if sub is actually a string
        if not isinstance(user_id_str, str):
            print(f"ERROR: sub is not a string, it's {type(user_id_str)}: {user_id_str}")
            raise credentials_exception
        # Convert string to int (JWT sub must be string, but our DB uses int)
        user_id = int(user_id_str)
        print(f"Looking for user with id: {user_id}")
    except (JWTError, ValueError) as e:
        print(f"JWT Error: {e}")
        print(f"Token that failed: {token[:50]}...")
        # Try to decode without verification to see what's in it
        try:
            import jwt as jwt_lib
            unverified = jwt_lib.decode(token, options={"verify_signature": False})
            print(f"Unverified payload (for debugging): {unverified}")
            print(f"Type of 'sub' in unverified payload: {type(unverified.get('sub'))}")
        except:
            pass
        raise credentials_exception
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        print(f"ERROR: User with id {user_id} not found in database")
        raise credentials_exception
    print(f"User found: {user.email}")
    return user

