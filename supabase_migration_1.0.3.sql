-- Migration for CRM v1.0.3 (All-Inclusive & Safe)
-- Instructions: Copy and run this script in the Supabase SQL Editor.

-- 1. Create inventory_items table if it does not exist (from Warehouse Integration)
CREATE TABLE IF NOT EXISTS public.inventory_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL, -- '3d_print' or 'outdoor_ads'
    item_type TEXT NOT NULL, -- 'filament', 'banner_mat', 'eyelet', 'frame_pipe', 'face_mat', 'side_profile', 'led_module', 'power_supply'
    stock_quantity NUMERIC DEFAULT 0.0 NOT NULL,
    unit TEXT DEFAULT 'pcs' NOT NULL, -- 'kg', 'sqm', 'meters', 'pcs'
    price_per_unit NUMERIC DEFAULT 0.0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on inventory_items
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

-- Create policies for inventory_items if they do not exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'inventory_items' AND policyname = 'Inventory is readable by authenticated users'
    ) THEN
        CREATE POLICY "Inventory is readable by authenticated users" ON public.inventory_items
          FOR SELECT TO authenticated USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'inventory_items' AND policyname = 'Admins and Managers can manage inventory'
    ) THEN
        CREATE POLICY "Admins and Managers can manage inventory" ON public.inventory_items
          FOR ALL TO authenticated USING (
            public.check_user_role(ARRAY['admin'::user_role, 'manager'::user_role])
          )
          WITH CHECK (
            public.check_user_role(ARRAY['admin'::user_role, 'manager'::user_role])
          );
    END IF;
END $$;

-- Populate default materials if the table is empty
INSERT INTO public.inventory_items (name, category, item_type, stock_quantity, unit, price_per_unit)
SELECT name, category, item_type, stock_quantity, unit, price_per_unit
FROM (VALUES
    ('PLA Plastic (Standard)', '3d_print', 'filament', 10.0, 'kg', 1500.0),
    ('PETG Plastic (Strong)', '3d_print', 'filament', 5.0, 'kg', 1800.0),
    ('ABS Plastic (Heat-Resistant)', '3d_print', 'filament', 4.0, 'kg', 1700.0),
    ('TPU Plastic (Flexible)', '3d_print', 'filament', 2.0, 'kg', 3500.0),
    ('Nylon Plastic (Engineering)', '3d_print', 'filament', 1.0, 'kg', 4000.0),
    ('Frontlit Banner 440g', 'outdoor_ads', 'banner_mat', 150.0, 'sqm', 500.0),
    ('Backlit Banner 510g', 'outdoor_ads', 'banner_mat', 80.0, 'sqm', 800.0),
    ('Standard Eyelet 12mm', 'outdoor_ads', 'eyelet', 2000.0, 'pcs', 15.0),
    ('Reinforced Eyelet 16mm', 'outdoor_ads', 'eyelet', 1000.0, 'pcs', 25.0),
    ('Edge Welding Tape', 'outdoor_ads', 'edge_tape', 500.0, 'meters', 100.0),
    ('Metal Square Tube 20x20mm', 'outdoor_ads', 'frame_pipe', 120.0, 'meters', 300.0),
    ('Metal Square Tube 40x20mm', 'outdoor_ads', 'frame_pipe', 90.0, 'meters', 450.0),
    ('Acrylic Glass 3mm (White)', 'outdoor_ads', 'face_mat', 40.0, 'sqm', 3000.0),
    ('Polycarbonate 4mm (Translucent)', 'outdoor_ads', 'face_mat', 60.0, 'sqm', 2200.0),
    ('Aluminum Profile 130mm', 'outdoor_ads', 'side_profile', 180.0, 'meters', 800.0),
    ('Plastic Side Profile 100mm', 'outdoor_ads', 'side_profile', 100.0, 'meters', 550.0),
    ('LED Module SMD 2835 1.2W', 'outdoor_ads', 'led_module', 500.0, 'pcs', 45.0),
    ('LED Module SMD 5730 1.5W', 'outdoor_ads', 'led_module', 300.0, 'pcs', 60.0),
    ('Power Supply IP67 12V 100W', 'outdoor_ads', 'power_supply', 15.0, 'pcs', 1200.0),
    ('Power Supply IP67 12V 250W', 'outdoor_ads', 'power_supply', 10.0, 'pcs', 2400.0)
) AS v(name, category, item_type, stock_quantity, unit, price_per_unit)
WHERE NOT EXISTS (SELECT 1 FROM public.inventory_items);

-- 2. Add scrap_cost column to deals table
ALTER TABLE public.deals 
ADD COLUMN IF NOT EXISTS scrap_cost NUMERIC DEFAULT 0.0 NOT NULL;

-- 3. Create scrap_logs table
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

-- 4. Enable Row-Level Security
ALTER TABLE public.scrap_logs ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies
CREATE POLICY "Scrap logs are readable by authenticated users" ON public.scrap_logs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Scrap logs are manageable by authenticated users" ON public.scrap_logs
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 6. Trigger Functions for Automatic Inventory and Deal Updates
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

-- 7. Bind Triggers
DROP TRIGGER IF EXISTS on_scrap_logged ON public.scrap_logs;
CREATE TRIGGER on_scrap_logged
  AFTER INSERT ON public.scrap_logs
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_scrap();

DROP TRIGGER IF EXISTS on_scrap_deleted ON public.scrap_logs;
CREATE TRIGGER on_scrap_deleted
  AFTER DELETE ON public.scrap_logs
  FOR EACH ROW EXECUTE FUNCTION public.handle_deleted_scrap();
