-- Add auto reminders toggle to invoice settings
ALTER TABLE invoice_settings 
ADD COLUMN auto_reminders_enabled BOOLEAN NOT NULL DEFAULT false;

-- Add due date tracking to sent invoices
ALTER TABLE sent_invoices 
ADD COLUMN due_date DATE;

-- Add last reminder timestamp to sent invoices
ALTER TABLE sent_invoices 
ADD COLUMN last_reminder_sent_at TIMESTAMP WITH TIME ZONE;