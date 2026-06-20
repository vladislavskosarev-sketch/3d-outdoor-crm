-- Migration for CRM v1.0.3
-- Instructions: Copy and run this script in the Supabase SQL Editor.

-- 1. Add scrap_cost column to deals table
ALTER TABLE public.deals 
ADD COLUMN IF NOT EXISTS scrap_cost NUMERIC DEFAULT 0.0 NOT NULL;

-- 2. Create scrap_logs table
CREATE TABLE IF NOT EXISTS public.scrap_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE NOT NULL,
    material_id UUID REFERENCES public.inventory_items(id) ON DELETE SET NULL,
    material_name TEXT NOT NULL,
    quantity NUMERIC DEFAULT 0.0 NOT NULL,
    unit TEXT DEFAULT 'pcs' NOT NULL,
    cost NUMERIC DEFAULT 0.0 NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Enable Row-Level Security
ALTER TABLE public.scrap_logs ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies
CREATE POLICY "Scrap logs are readable by authenticated users" ON public.scrap_logs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Scrap logs are manageable by authenticated users" ON public.scrap_logs
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 5. Trigger Functions for Automatic Inventory and Deal Updates
CREATE OR REPLACE FUNCTION public.handle_new_scrap()
RETURNS TRIGGER AS $$
BEGIN
  -- 1. Deduct from inventory (if material_id is provided)
  IF new.material_id IS NOT NULL THEN
    UPDATE public.inventory_items 
    SET stock_quantity = stock_quantity - new.quantity
    WHERE id = new.material_id;
  END IF;

  -- 2. Add cost to deal scrap_cost
  UPDATE public.deals
  SET scrap_cost = scrap_cost + new.cost
  WHERE id = new.deal_id;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.handle_deleted_scrap()
RETURNS TRIGGER AS $$
BEGIN
  -- 1. Restore inventory (if material_id is provided)
  IF old.material_id IS NOT NULL THEN
    UPDATE public.inventory_items 
    SET stock_quantity = stock_quantity + old.quantity
    WHERE id = old.material_id;
  END IF;

  -- 2. Subtract cost from deal scrap_cost
  UPDATE public.deals
  SET scrap_cost = GREATEST(0.0, scrap_cost - old.cost)
  WHERE id = old.deal_id;

  RETURN old;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6. Bind Triggers
DROP TRIGGER IF EXISTS on_scrap_logged ON public.scrap_logs;
CREATE TRIGGER on_scrap_logged
  AFTER INSERT ON public.scrap_logs
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_scrap();

DROP TRIGGER IF EXISTS on_scrap_deleted ON public.scrap_logs;
CREATE TRIGGER on_scrap_deleted
  AFTER DELETE ON public.scrap_logs
  FOR EACH ROW EXECUTE FUNCTION public.handle_deleted_scrap();
