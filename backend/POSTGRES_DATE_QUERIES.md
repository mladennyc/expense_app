# PostgreSQL Date Queries - Year-Month Extraction

## Extract Year-Month from Date

### Format: YYYY-MM (e.g., "2024-01")
```sql
SELECT TO_CHAR(date_column, 'YYYY-MM') AS year_month
FROM your_table;
```

### Format: YYYY-MM-DD to YYYY-MM
```sql
SELECT TO_CHAR('2024-01-15'::date, 'YYYY-MM') AS year_month;
-- Result: "2024-01"
```

### Group by Year-Month
```sql
SELECT 
    TO_CHAR(date_column, 'YYYY-MM') AS year_month,
    SUM(amount) AS total
FROM expenses
GROUP BY TO_CHAR(date_column, 'YYYY-MM')
ORDER BY year_month DESC;
```

### Filter by Year-Month
```sql
-- Get all expenses for January 2024
SELECT *
FROM expenses
WHERE TO_CHAR(date_column, 'YYYY-MM') = '2024-01';
```

### Extract Year and Month Separately
```sql
SELECT 
    EXTRACT(YEAR FROM date_column) AS year,
    EXTRACT(MONTH FROM date_column) AS month,
    TO_CHAR(date_column, 'YYYY-MM') AS year_month
FROM expenses;
```

### Get Current Year-Month
```sql
SELECT TO_CHAR(CURRENT_DATE, 'YYYY-MM') AS current_month;
-- Result: "2024-11" (or current month)
```

### Get Last 6 Months
```sql
SELECT 
    TO_CHAR(
        CURRENT_DATE - (n || ' months')::INTERVAL,
        'YYYY-MM'
    ) AS month
FROM generate_series(0, 5) AS n
ORDER BY month DESC;
```

### Example: Expenses by Month
```sql
SELECT 
    TO_CHAR(date, 'YYYY-MM') AS month,
    COUNT(*) AS expense_count,
    SUM(amount) AS total_amount
FROM expenses
WHERE user_id = 1
GROUP BY TO_CHAR(date, 'YYYY-MM')
ORDER BY month DESC
LIMIT 6;
```

## Common Patterns

### Date Range by Month
```sql
-- Get all expenses between two months
SELECT *
FROM expenses
WHERE TO_CHAR(date, 'YYYY-MM') >= '2024-01'
  AND TO_CHAR(date, 'YYYY-MM') <= '2024-12';
```

### Compare Current Month vs Previous Month
```sql
SELECT 
    TO_CHAR(date, 'YYYY-MM') AS month,
    SUM(amount) AS total
FROM expenses
WHERE TO_CHAR(date, 'YYYY-MM') IN (
    TO_CHAR(CURRENT_DATE, 'YYYY-MM'),
    TO_CHAR(CURRENT_DATE - INTERVAL '1 month', 'YYYY-MM')
)
GROUP BY TO_CHAR(date, 'YYYY-MM');
```

### Get Month Start and End Dates
```sql
SELECT 
    TO_CHAR(date, 'YYYY-MM') AS year_month,
    DATE_TRUNC('month', date) AS month_start,
    (DATE_TRUNC('month', date) + INTERVAL '1 month' - INTERVAL '1 day')::DATE AS month_end
FROM expenses;
```

## Expenses and Net Income Per Month Per User

```sql
SELECT
    u.id AS user_id,
    u.email,
    u.name AS user_name,
    TO_CHAR(combined.date, 'YYYY-MM') AS month,
    SUM(CASE WHEN combined.type = 'expense' THEN combined.amount::numeric ELSE 0 END) AS total_expenses,
    SUM(CASE WHEN combined.type = 'income' THEN combined.amount::numeric ELSE 0 END) AS total_income,
    SUM(CASE WHEN combined.type = 'income' THEN combined.amount::numeric ELSE 0 END) -
    SUM(CASE WHEN combined.type = 'expense' THEN combined.amount::numeric ELSE 0 END) AS net_income
FROM (
    SELECT user_id, date, amount, 'expense' AS type FROM expenses
    UNION ALL
    SELECT user_id, date, amount, 'income' AS type FROM incomes
) combined
JOIN users u ON combined.user_id = u.id
GROUP BY u.id, u.email, u.name, TO_CHAR(combined.date, 'YYYY-MM')
ORDER BY u.id, month DESC;
```

### Simplified Version (Without User Details)
```sql
SELECT
    user_id,
    TO_CHAR(date, 'YYYY-MM') AS month,
    SUM(CASE WHEN type = 'expense' THEN amount::numeric ELSE 0 END) AS total_expenses,
    SUM(CASE WHEN type = 'income' THEN amount::numeric ELSE 0 END) AS total_income,
    SUM(CASE WHEN type = 'income' THEN amount::numeric ELSE 0 END) -
    SUM(CASE WHEN type = 'expense' THEN amount::numeric ELSE 0 END) AS net_income
FROM (
    SELECT user_id, date, amount, 'expense' AS type FROM expenses
    UNION ALL
    SELECT user_id, date, amount, 'income' AS type FROM incomes
) combined
GROUP BY user_id, TO_CHAR(date, 'YYYY-MM')
ORDER BY user_id, month DESC;
```

### For a Specific User
```sql
SELECT
    TO_CHAR(combined.date, 'YYYY-MM') AS month,
    SUM(CASE WHEN combined.type = 'expense' THEN combined.amount::numeric ELSE 0 END) AS total_expenses,
    SUM(CASE WHEN combined.type = 'income' THEN combined.amount::numeric ELSE 0 END) AS total_income,
    SUM(CASE WHEN combined.type = 'income' THEN combined.amount::numeric ELSE 0 END) -
    SUM(CASE WHEN combined.type = 'expense' THEN combined.amount::numeric ELSE 0 END) AS net_income
FROM (
    SELECT user_id, date, amount, 'expense' AS type FROM expenses WHERE user_id = 1
    UNION ALL
    SELECT user_id, date, amount, 'income' AS type FROM incomes WHERE user_id = 1
) combined
GROUP BY TO_CHAR(combined.date, 'YYYY-MM')
ORDER BY month DESC;
```

## In Python/SQLAlchemy

```python
from sqlalchemy import func, extract

# Using SQLAlchemy
year_month = func.to_char(Expense.date, 'YYYY-MM')
expenses = db.query(
    year_month.label('month'),
    func.sum(Expense.amount).label('total')
).group_by(year_month).all()
```


