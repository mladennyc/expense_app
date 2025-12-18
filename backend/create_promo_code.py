"""
Script to create GOLDENKEY2025 promo code
Works for both local (SQLite) and production (PostgreSQL)

Usage:
    Local: python create_promo_code.py
    Production: Set DATABASE_URL env var and run: python create_promo_code.py
"""
import os
from database import SessionLocal, PromoCode
from datetime import datetime

def create_promo_code():
    """Create GOLDENKEY2025 promo code"""
    db = SessionLocal()
    try:
        # Check if code already exists
        existing = db.query(PromoCode).filter(PromoCode.code == 'GOLDENKEY2025').first()
        if existing:
            print("WARNING: Promo code 'GOLDENKEY2025' already exists!")
            print(f"   Used {existing.used_count} times")
            print(f"   Active: {existing.is_active}")
            return
        
        # Create new promo code
        promo_code = PromoCode(
            code='GOLDENKEY2025',
            type='unlimited_access',
            max_uses=None,  # Unlimited uses
            used_count=0,
            expires_at=None,  # Never expires
            is_active=True
        )
        
        db.add(promo_code)
        db.commit()
        db.refresh(promo_code)
        
        print("SUCCESS: Promo code 'GOLDENKEY2025' created successfully!")
        print(f"   Type: unlimited_access")
        print(f"   Max uses: Unlimited")
        print(f"   Expires: Never")
        print(f"   Active: True")
        
    except Exception as e:
        db.rollback()
        print(f"ERROR: Error creating promo code: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    # Check which database we're using
    db_url = os.getenv("DATABASE_URL", "sqlite:///./expenses.db")
    if "postgresql" in db_url or "postgres" in db_url:
        print("Using PostgreSQL database (production)")
    else:
        print("Using SQLite database (local)")
    
    print("\nCreating promo code...")
    create_promo_code()

