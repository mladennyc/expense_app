from sqlalchemy import create_engine, Column, Integer, String, Float, Date, DateTime, ForeignKey, Boolean, Enum as SQLEnum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os
import enum

# Use PostgreSQL if DATABASE_URL is set (Render), otherwise use SQLite (local development)
DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL:
    # PostgreSQL (production on Render)
    # Render provides DATABASE_URL in format: postgresql://user:pass@host:port/dbname
    # SQLAlchemy needs postgresql:// (not postgres://)
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    SQLALCHEMY_DATABASE_URL = DATABASE_URL
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
else:
    # SQLite (local development)
    SQLALCHEMY_DATABASE_URL = "sqlite:///./expenses.db"
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


class SubscriptionPlanType(str, enum.Enum):
    LIMITED = "limited"
    FREE = "free"
    EXTRA_30 = "extra_30"
    UNLIMITED = "unlimited"


class SubscriptionStatus(str, enum.Enum):
    ACTIVE = "active"
    CANCELLED = "cancelled"
    EXPIRED = "expired"


class PromoCodeType(str, enum.Enum):
    UNLIMITED = "unlimited_access"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=True)
    password_hash = Column(String, nullable=False)
    name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    reset_token = Column(String, nullable=True)
    reset_token_expires = Column(DateTime, nullable=True)

    expenses = relationship("Expense", back_populates="owner")
    incomes = relationship("Income", back_populates="owner")
    subscription = relationship("Subscription", back_populates="user", uselist=False)
    receipt_scans = relationship("ReceiptScan", back_populates="user")
    notifications = relationship("Notification", back_populates="user")


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount = Column(Float, nullable=False)
    date = Column(Date, nullable=False)
    category = Column(String, nullable=True)
    description = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="expenses")


class Income(Base):
    __tablename__ = "incomes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount = Column(Float, nullable=False)
    date = Column(Date, nullable=False)
    category = Column(String, nullable=True)
    description = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="incomes")


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    plan_type = Column(String, nullable=False)  # 'free', 'extra_30', 'unlimited'
    status = Column(String, nullable=False, default="active")  # 'active', 'cancelled', 'expired'
    stripe_subscription_id = Column(String, nullable=True)
    stripe_customer_id = Column(String, nullable=True)
    promo_code_id = Column(Integer, ForeignKey("promo_codes.id"), nullable=True)
    current_period_start = Column(DateTime, nullable=True)
    current_period_end = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="subscription")
    promo_code = relationship("PromoCode", back_populates="subscriptions")


class ReceiptScan(Base):
    __tablename__ = "receipt_scans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    scan_date = Column(DateTime, default=datetime.utcnow)
    month_year = Column(String, nullable=False)  # Format: 'YYYY-MM'
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="receipt_scans")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    message = Column(String, nullable=False)
    type = Column(String, nullable=False)  # 'payment_failed', 'subscription_cancelled', etc.
    read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="notifications")


class PromoCode(Base):
    __tablename__ = "promo_codes"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, nullable=False, index=True)
    type = Column(String, nullable=False)  # 'unlimited_access'
    max_uses = Column(Integer, nullable=True)  # null = unlimited uses
    used_count = Column(Integer, default=0)
    expires_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    subscriptions = relationship("Subscription", back_populates="promo_code")


# Create tables
def init_db():
    Base.metadata.create_all(bind=engine)
    
    # Create subscriptions for existing users who don't have one
    db = SessionLocal()
    try:
        # Get all users
        all_users = db.query(User).all()
        
        # For each user, check if they have a subscription
        for user in all_users:
            existing_subscription = db.query(Subscription).filter(Subscription.user_id == user.id).first()
            
            # If no subscription exists, create a default "limited" subscription
            if not existing_subscription:
                new_subscription = Subscription(
                    user_id=user.id,
                    plan_type=SubscriptionPlanType.LIMITED.value,
                    status=SubscriptionStatus.ACTIVE.value
                )
                db.add(new_subscription)
        
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error creating subscriptions for existing users: {e}")
    finally:
        db.close()


# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

