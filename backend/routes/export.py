from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from datetime import datetime
import csv
import io
import traceback

from database import get_db, User, Expense as ExpenseModel, Income as IncomeModel
from auth import get_current_user

router = APIRouter()


@router.get("/export/csv")
async def export_csv(
    start_date: str,
    end_date: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Export expenses and income as CSV"""
    try:
        # Parse dates
        start = datetime.strptime(start_date, "%Y-%m-%d").date()
        end = datetime.strptime(end_date, "%Y-%m-%d").date()
        
        if start > end:
            raise HTTPException(status_code=400, detail="Start date must be before end date")
        
        # Get expenses
        expenses = db.query(ExpenseModel).filter(
            ExpenseModel.user_id == current_user.id,
            ExpenseModel.date >= start,
            ExpenseModel.date <= end
        ).order_by(ExpenseModel.date.desc()).all()
        
        # Get income
        incomes = db.query(IncomeModel).filter(
            IncomeModel.user_id == current_user.id,
            IncomeModel.date >= start,
            IncomeModel.date <= end
        ).order_by(IncomeModel.date.desc()).all()
        
        # Create CSV in memory
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow(['Type', 'Date', 'Amount', 'Category', 'Description'])
        
        # Write expenses
        for expense in expenses:
            writer.writerow([
                'Expense',
                expense.date.isoformat() if expense.date else '',
                expense.amount if expense.amount else '',
                expense.category if expense.category else '',
                expense.description if expense.description else ''
            ])
        
        # Write income
        for income in incomes:
            writer.writerow([
                'Income',
                income.date.isoformat() if income.date else '',
                income.amount if income.amount else '',
                income.category if income.category else '',
                income.description if income.description else ''
            ])
        
        # Get CSV content
        csv_content = output.getvalue()
        output.close()
        
        # Generate filename
        filename = f"expenses_{start_date}_to_{end_date}.csv"
        
        # Return CSV file (encode to bytes for proper download)
        return Response(
            content=csv_content.encode('utf-8-sig'),  # UTF-8 with BOM for Excel compatibility
            media_type="text/csv; charset=utf-8",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"'
            }
        )
        
    except ValueError as e:
        print(f"CSV Export ValueError: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Invalid date format: {str(e)}")
    except Exception as e:
        error_trace = traceback.format_exc()
        print(f"CSV Export Error: {str(e)}")
        print(f"Traceback: {error_trace}")
        raise HTTPException(status_code=500, detail=f"Error generating CSV: {str(e)}")



