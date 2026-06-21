-- Migration for CRM v1.0.4 (Adding min_stock_level to inventory_items)
-- Instructions: Copy and run this script in the Supabase SQL Editor.

-- Add min_stock_level column to inventory_items table
ALTER TABLE public.inventory_items 
ADD COLUMN IF NOT EXISTS min_stock_level NUMERIC DEFAULT 0.0 NOT NULL;
