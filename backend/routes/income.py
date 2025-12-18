from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import date, timedelta

from database import get_db, User, Income as IncomeModel
from auth import get_current_user
from models import IncomeIn, Income

router = APIRouter()


@router.post("/income", response_model=Income)
async def create_income(
    income: IncomeIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new income entry (requires authentication)"""
    db_income = IncomeModel(
        user_id=current_user.id,
        amount=income.amount,
        date=income.date,
        category=income.category,
        description=income.description
    )
    db.add(db_income)
    db.commit()
    db.refresh(db_income)
    
    return Income(
        id=db_income.id,
        amount=db_income.amount,
        date=db_income.date,
        category=db_income.category,
        description=db_income.description
    )


@router.get("/income/recent", response_model=List[Income])
async def get_recent_income(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all income entries from the past 2 months for current user sorted by date descending"""
    # Calculate date 2 months ago
    two_months_ago = date.today() - timedelta(days=60)
    
    incomes = db.query(IncomeModel).filter(
        IncomeModel.user_id == current_user.id,
        IncomeModel.date >= two_months_ago
    ).order_by(IncomeModel.date.desc()).all()
    
    return [
        Income(
            id=i.id,
            amount=i.amount,
            date=i.date,
            category=i.category,
            description=i.description
        )
        for i in incomes
    ]


@router.get("/income/{income_id}", response_model=Income)
async def get_income(
    income_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific income entry by ID (requires authentication)"""
    income = db.query(IncomeModel).filter(
        IncomeModel.id == income_id,
        IncomeModel.user_id == current_user.id
    ).first()
    
    if not income:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Income not found"
        )
    
    return Income(
        id=income.id,
        amount=income.amount,
        date=income.date,
        category=income.category,
        description=income.description
    )


@router.put("/income/{income_id}", response_model=Income)
async def update_income(
    income_id: int,
    income: IncomeIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update an existing income entry (requires authentication)"""
    db_income = db.query(IncomeModel).filter(
        IncomeModel.id == income_id,
        IncomeModel.user_id == current_user.id
    ).first()
    
    if not db_income:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Income not found"
        )
    
    # Update income fields
    db_income.amount = income.amount
    db_income.date = income.date
    db_income.category = income.category
    db_income.description = income.description
    
    db.commit()
    db.refresh(db_income)
    
    return Income(
        id=db_income.id,
        amount=db_income.amount,
        date=db_income.date,
        category=db_income.category,
        description=db_income.description
    )


@router.delete("/income/{income_id}")
async def delete_income(
    income_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an income entry (requires authentication)"""
    db_income = db.query(IncomeModel).filter(
        IncomeModel.id == income_id,
        IncomeModel.user_id == current_user.id
    ).first()
    
    if not db_income:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Income not found"
        )
    
    db.delete(db_income)
    db.commit()
    
    return {"message": "Income deleted successfully"}



