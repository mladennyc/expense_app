from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import date, timedelta

from database import get_db, User, Expense as ExpenseModel
from auth import get_current_user
from models import ExpenseIn, Expense, ExpenseBatchIn

router = APIRouter()


@router.post("/expenses", response_model=Expense)
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


@router.post("/expenses/batch", response_model=list[Expense])
async def create_expenses_batch(
    batch: ExpenseBatchIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create multiple expenses at once (requires authentication)"""
    created_expenses = []
    
    for expense in batch.expenses:
        db_expense = ExpenseModel(
            user_id=current_user.id,
            amount=expense.amount,
            date=expense.date,
            category=expense.category,
            description=expense.description
        )
        db.add(db_expense)
        created_expenses.append(db_expense)
    
    db.commit()
    
    # Refresh all expenses
    for db_expense in created_expenses:
        db.refresh(db_expense)
    
    return [
        Expense(
            id=e.id,
            amount=e.amount,
            date=e.date,
            category=e.category,
            description=e.description
        )
        for e in created_expenses
    ]


@router.get("/expenses/recent", response_model=List[Expense])
async def get_recent_expenses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all expenses from the past 2 months for current user sorted by date descending"""
    # Calculate date 2 months ago
    two_months_ago = date.today() - timedelta(days=60)
    
    expenses = db.query(ExpenseModel).filter(
        ExpenseModel.user_id == current_user.id,
        ExpenseModel.date >= two_months_ago
    ).order_by(ExpenseModel.date.desc()).all()
    
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


@router.get("/expenses/{expense_id}", response_model=Expense)
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


@router.put("/expenses/{expense_id}", response_model=Expense)
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


@router.delete("/expenses/{expense_id}")
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



