from fastapi import FastAPI
from pydantic import BaseModel, field_validator
from typing import List, Optional
from datetime import datetime, date
from collections import defaultdict

app = FastAPI()

# In-memory storage for expenses
expenses = []
next_id = 1


class ExpenseIn(BaseModel):
    amount: float
    date: date
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
    description: Optional[str] = None


@app.get("/health")
async def health_check():
    return {"status": "ok"}


@app.post("/expenses", response_model=Expense)
async def create_expense(expense: ExpenseIn):
    """Create a new expense"""
    global next_id
    new_expense = Expense(
        id=next_id,
        amount=expense.amount,
        date=expense.date,
        description=expense.description
    )
    expenses.append(new_expense)
    next_id += 1
    return new_expense


@app.get("/expenses/recent", response_model=List[Expense])
async def get_recent_expenses():
    """Get the last 10 expenses sorted by date descending"""
    sorted_expenses = sorted(
        expenses,
        key=lambda x: x.date,
        reverse=True
    )
    return sorted_expenses[:10]


@app.get("/stats/current-month")
async def get_current_month_stats():
    """Get total expenses for the current month"""
    current_date = datetime.now().date()
    current_month = current_date.strftime("%Y-%m")
    total = sum(
        expense.amount
        for expense in expenses
        if expense.date.year == current_date.year and expense.date.month == current_date.month
    )
    return {"month": current_month, "total": total}


@app.get("/stats/by-month")
async def get_stats_by_month():
    """Get totals grouped by YYYY-MM, sorted by month"""
    monthly_totals = defaultdict(float)
    for expense in expenses:
        month_key = expense.date.strftime("%Y-%m")
        monthly_totals[month_key] += expense.amount
    
    result = [
        {"month": month, "total": total}
        for month, total in sorted(monthly_totals.items(), reverse=True)
    ]
    return result
