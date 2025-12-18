from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, date, timedelta
from collections import defaultdict
from typing import Optional

from database import get_db, User, Expense as ExpenseModel, Income as IncomeModel
from auth import get_current_user

router = APIRouter()


@router.get("/stats/current-month")
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


@router.get("/stats/current-month-by-category")
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


@router.get("/stats/month-by-category")
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


@router.get("/stats/by-month")
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


@router.get("/stats/income/current-month")
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


@router.get("/stats/income/by-month")
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


@router.get("/stats/net-income")
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



