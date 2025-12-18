from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import inspect
import os

from database import get_db, User, Expense as ExpenseModel, Income as IncomeModel

router = APIRouter()


@router.get("/debug/db-stats")
async def get_db_stats(db: Session = Depends(get_db)):
    """Debug endpoint to check database contents (for troubleshooting)"""
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



