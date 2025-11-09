#!/usr/bin/env python3
"""Script to check if data exists in the database"""
import os
from sqlalchemy import create_engine, text
from database import get_db, User, Expense as ExpenseModel, Income as IncomeModel

# Get database URL
DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

if not DATABASE_URL:
    print("ERROR: DATABASE_URL not set")
    exit(1)

engine = create_engine(DATABASE_URL)

print(f"Connecting to database...")
print(f"Database URL: {DATABASE_URL.split('@')[1] if '@' in DATABASE_URL else 'hidden'}")

with engine.connect() as conn:
    # Check if tables exist
    result = conn.execute(text("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name;
    """))
    tables = [row[0] for row in result]
    print(f"\nTables in database: {', '.join(tables)}")
    
    # Check users table
    if 'users' in tables:
        result = conn.execute(text("SELECT COUNT(*) FROM users"))
        user_count = result.scalar()
        print(f"\nUsers in database: {user_count}")
        
        if user_count > 0:
            result = conn.execute(text("SELECT id, email, username, name, created_at FROM users ORDER BY created_at DESC LIMIT 10"))
            print("\nRecent users:")
            for row in result:
                print(f"  ID: {row[0]}, Email: {row[1]}, Username: {row[2]}, Name: {row[3]}, Created: {row[4]}")
    else:
        print("\nERROR: 'users' table does not exist!")
    
    # Check expenses table
    if 'expenses' in tables:
        result = conn.execute(text("SELECT COUNT(*) FROM expenses"))
        expense_count = result.scalar()
        print(f"\nExpenses in database: {expense_count}")
    else:
        print("\nWARNING: 'expenses' table does not exist")
    
    # Check incomes table
    if 'incomes' in tables:
        result = conn.execute(text("SELECT COUNT(*) FROM incomes"))
        income_count = result.scalar()
        print(f"\nIncomes in database: {income_count}")
    else:
        print("\nWARNING: 'incomes' table does not exist (this is expected if you just added it)")

