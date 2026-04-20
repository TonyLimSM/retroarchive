-- Expand console_type to include Nintendo Switch.
-- Non-destructive: ALTER TYPE ... ADD VALUE appends to the enum without
-- rewriting the table. Existing rows are untouched.
alter type console_type add value if not exists 'Switch';
