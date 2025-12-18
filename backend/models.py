from pydantic import BaseModel, field_validator, EmailStr
from typing import Optional
from datetime import date


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


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordReset(BaseModel):
    token: str
    new_password: str


class ExpenseBatchIn(BaseModel):
    expenses: list[ExpenseIn]


class ReceiptScanRequest(BaseModel):
    image_base64: str
    language: Optional[str] = 'en'  # User's language preference


class CheckoutRequest(BaseModel):
    plan_type: str  # 'extra_30' or 'unlimited'


class PromoCodeRequest(BaseModel):
    code: str

