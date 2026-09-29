ALTER TABLE expenses
  ADD COLUMN recurring_expense_uuid VARCHAR(36)  NULL,
  ADD COLUMN `year_month`           VARCHAR(7)   NULL,
  ADD UNIQUE KEY uq_recurring_month (recurring_expense_uuid, `year_month`);
