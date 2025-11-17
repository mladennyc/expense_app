-- ============================================
-- PostgreSQL Version (RECOMMENDED - SIMPLEST)
-- ============================================

-- Simple PostgreSQL query with user details (works best):
SELECT 
    u.id AS user_id,
    u.email,
    u.name AS user_name,
    TO_CHAR(date, 'YYYY-MM') AS month,
    SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS total_expenses,
    SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS total_income,
    SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) - 
    SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS net_income
FROM (
    SELECT user_id, date, amount, 'expense' AS type FROM expenses
    UNION ALL
    SELECT user_id, date, amount, 'income' AS type FROM incomes
) combined
JOIN users u ON combined.user_id = u.id
GROUP BY u.id, u.email, u.name, TO_CHAR(date, 'YYYY-MM')
ORDER BY u.id, month DESC;

-- For a specific user (replace USER_ID):
SELECT 
    TO_CHAR(date, 'YYYY-MM') AS month,
    SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS total_expenses,
    SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS total_income,
    SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) - 
    SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS net_income
FROM (
    SELECT date, amount, 'expense' AS type FROM expenses WHERE user_id = USER_ID
    UNION ALL
    SELECT date, amount, 'income' AS type FROM incomes WHERE user_id = USER_ID
) combined
GROUP BY TO_CHAR(date, 'YYYY-MM')
ORDER BY month DESC;

-- ============================================
-- Alternative PostgreSQL Queries
-- ============================================

-- Monthly Summary Query (PostgreSQL) - Alternative with user info
SELECT 
    u.id AS user_id,
    u.email,
    u.name AS user_name,
    DATE_TRUNC('month', COALESCE(e.date, i.date)) AS month,
    TO_CHAR(DATE_TRUNC('month', COALESCE(e.date, i.date)), 'YYYY-MM') AS month_str,
    COALESCE(SUM(e.amount), 0) AS total_expenses,
    COALESCE(SUM(i.amount), 0) AS total_income,
    COALESCE(SUM(i.amount), 0) - COALESCE(SUM(e.amount), 0) AS net_income
FROM users u
LEFT JOIN expenses e ON u.id = e.user_id
LEFT JOIN incomes i ON u.id = i.user_id 
    AND DATE_TRUNC('month', i.date) = DATE_TRUNC('month', e.date)
GROUP BY u.id, u.email, u.name, DATE_TRUNC('month', COALESCE(e.date, i.date))
ORDER BY u.id, month DESC;

-- Alternative: Using FULL OUTER JOIN for better handling of months with only expenses or only income
SELECT 
    COALESCE(e.user_id, i.user_id) AS user_id,
    u.email,
    u.name AS user_name,
    COALESCE(DATE_TRUNC('month', e.date), DATE_TRUNC('month', i.date)) AS month,
    TO_CHAR(COALESCE(DATE_TRUNC('month', e.date), DATE_TRUNC('month', i.date)), 'YYYY-MM') AS month_str,
    COALESCE(SUM(e.amount), 0) AS total_expenses,
    COALESCE(SUM(i.amount), 0) AS total_income,
    COALESCE(SUM(i.amount), 0) - COALESCE(SUM(e.amount), 0) AS net_income
FROM expenses e
FULL OUTER JOIN incomes i ON e.user_id = i.user_id 
    AND DATE_TRUNC('month', e.date) = DATE_TRUNC('month', i.date)
LEFT JOIN users u ON COALESCE(e.user_id, i.user_id) = u.id
GROUP BY COALESCE(e.user_id, i.user_id), u.email, u.name, 
         COALESCE(DATE_TRUNC('month', e.date), DATE_TRUNC('month', i.date))
ORDER BY user_id, month DESC;

-- For a specific user (replace USER_ID with actual user ID):
SELECT 
    DATE_TRUNC('month', COALESCE(e.date, i.date)) AS month,
    TO_CHAR(DATE_TRUNC('month', COALESCE(e.date, i.date)), 'YYYY-MM') AS month_str,
    COALESCE(SUM(e.amount), 0) AS total_expenses,
    COALESCE(SUM(i.amount), 0) AS total_income,
    COALESCE(SUM(i.amount), 0) - COALESCE(SUM(e.amount), 0) AS net_income
FROM expenses e
FULL OUTER JOIN incomes i ON e.user_id = i.user_id 
    AND DATE_TRUNC('month', e.date) = DATE_TRUNC('month', i.date)
WHERE COALESCE(e.user_id, i.user_id) = USER_ID
GROUP BY DATE_TRUNC('month', COALESCE(e.date, i.date))
ORDER BY month DESC;

-- ============================================
-- SQLite Version (for local development)
-- ============================================

-- All users, monthly summary (SQLite):
SELECT 
    u.id AS user_id,
    u.email,
    u.name AS user_name,
    month_year AS month,
    COALESCE(expense_totals.total_expenses, 0) AS total_expenses,
    COALESCE(income_totals.total_income, 0) AS total_income,
    COALESCE(income_totals.total_income, 0) - COALESCE(expense_totals.total_expenses, 0) AS net_income
FROM users u
CROSS JOIN (
    SELECT DISTINCT strftime('%Y-%m', date) AS month_year FROM expenses
    UNION
    SELECT DISTINCT strftime('%Y-%m', date) AS month_year FROM incomes
) months
LEFT JOIN (
    SELECT 
        user_id,
        strftime('%Y-%m', date) AS month_year,
        SUM(amount) AS total_expenses
    FROM expenses
    GROUP BY user_id, strftime('%Y-%m', date)
) expense_totals ON u.id = expense_totals.user_id AND months.month_year = expense_totals.month_year
LEFT JOIN (
    SELECT 
        user_id,
        strftime('%Y-%m', date) AS month_year,
        SUM(amount) AS total_income
    FROM incomes
    GROUP BY user_id, strftime('%Y-%m', date)
) income_totals ON u.id = income_totals.user_id AND months.month_year = income_totals.month_year
WHERE COALESCE(expense_totals.total_expenses, 0) > 0 
   OR COALESCE(income_totals.total_income, 0) > 0
ORDER BY u.id, month DESC;

-- For a specific user (SQLite) - replace USER_ID:
SELECT 
    month_year AS month,
    COALESCE(expense_totals.total_expenses, 0) AS total_expenses,
    COALESCE(income_totals.total_income, 0) AS total_income,
    COALESCE(income_totals.total_income, 0) - COALESCE(expense_totals.total_expenses, 0) AS net_income
FROM (
    SELECT DISTINCT strftime('%Y-%m', date) AS month_year FROM expenses WHERE user_id = USER_ID
    UNION
    SELECT DISTINCT strftime('%Y-%m', date) AS month_year FROM incomes WHERE user_id = USER_ID
) months
LEFT JOIN (
    SELECT 
        strftime('%Y-%m', date) AS month_year,
        SUM(amount) AS total_expenses
    FROM expenses
    WHERE user_id = USER_ID
    GROUP BY strftime('%Y-%m', date)
) expense_totals ON months.month_year = expense_totals.month_year
LEFT JOIN (
    SELECT 
        strftime('%Y-%m', date) AS month_year,
        SUM(amount) AS total_income
    FROM incomes
    WHERE user_id = USER_ID
    GROUP BY strftime('%Y-%m', date)
) income_totals ON months.month_year = income_totals.month_year
ORDER BY month DESC;

-- Simpler SQLite version (combines expenses and income in one query):
SELECT 
    user_id,
    month_year AS month,
    SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS total_expenses,
    SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS total_income,
    SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) - 
    SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS net_income
FROM (
    SELECT user_id, strftime('%Y-%m', date) AS month_year, amount, 'expense' AS type
    FROM expenses
    UNION ALL
    SELECT user_id, strftime('%Y-%m', date) AS month_year, amount, 'income' AS type
    FROM incomes
) combined
GROUP BY user_id, month_year
ORDER BY user_id, month DESC;

