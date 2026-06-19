-- Migration for CRM v1.0.1
-- Instructions: Copy and run this script in the Supabase SQL Editor.

-- 1. Add payment tracking columns to public.deals table
ALTER TABLE public.deals 
ADD COLUMN IF NOT EXISTS prepayment NUMERIC DEFAULT 0.0 NOT NULL,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid' NOT NULL 
    CHECK (payment_status IN ('unpaid', 'partially_paid', 'paid'));

-- 2. Add outsourcing/contractor tracking columns to public.deals table
ALTER TABLE public.deals 
ADD COLUMN IF NOT EXISTS is_outsourced BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN IF NOT EXISTS contractor_name TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS contractor_cost NUMERIC DEFAULT 0.0 NOT NULL;
