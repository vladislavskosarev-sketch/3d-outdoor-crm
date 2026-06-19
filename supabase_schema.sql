-- SUPABASE CRM DATABASE SCHEMA
-- Instructions: Copy and run this script in the Supabase SQL Editor.

-- Drop existing resources if they exist (clean start)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.jobs_outdoor_ads CASCADE;
DROP TABLE IF EXISTS public.jobs_3d_print CASCADE;
DROP TABLE IF EXISTS public.inventory_items CASCADE;
DROP TABLE IF EXISTS public.deals CASCADE;
DROP TABLE IF EXISTS public.clients CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS deal_stage CASCADE;
DROP TYPE IF EXISTS deal_type CASCADE;
DROP TYPE IF EXISTS print_status CASCADE;
DROP TYPE IF EXISTS outdoor_status CASCADE;
DROP TYPE IF EXISTS task_priority CASCADE;
DROP TYPE IF EXISTS task_status CASCADE;

-- 1. Create Enums
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'technician', 'pending', 'disabled');
CREATE TYPE deal_stage AS ENUM ('lead', 'negotiation', 'proposal_sent', 'in_production', 'installation', 'closed_won', 'closed_lost');
CREATE TYPE deal_type AS ENUM ('3d_printing', 'outdoor_ads', 'general');
CREATE TYPE print_status AS ENUM ('queued', 'printing', 'finished', 'failed', 'post_processing');
CREATE TYPE outdoor_status AS ENUM ('design', 'printing', 'assembly', 'installation', 'completed');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE task_status AS ENUM ('pending', 'completed');

-- 2. Create Tables
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role user_role DEFAULT 'pending' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE public.clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    company TEXT,
    phone TEXT,
    email TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE public.deals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    stage deal_stage DEFAULT 'lead' NOT NULL,
    deal_type deal_type DEFAULT 'general' NOT NULL,
    cost NUMERIC DEFAULT 0.0 NOT NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    assigned_manager UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE public.jobs_3d_print (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE UNIQUE,
    material_type TEXT DEFAULT 'PLA' NOT NULL,
    color TEXT DEFAULT 'Black',
    weight_grams NUMERIC DEFAULT 0.0 NOT NULL,
    print_time_hours NUMERIC DEFAULT 0.0 NOT NULL,
    printer_name TEXT DEFAULT 'Printer #1',
    status print_status DEFAULT 'queued' NOT NULL,
    calculated_cost NUMERIC DEFAULT 0.0 NOT NULL,
    settings_json JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE public.jobs_outdoor_ads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE UNIQUE,
    ad_type TEXT DEFAULT 'Banner' NOT NULL,
    width_m NUMERIC DEFAULT 0.0,
    height_m NUMERIC DEFAULT 0.0,
    materials_used TEXT,
    mounting_required BOOLEAN DEFAULT FALSE,
    installation_address TEXT,
    status outdoor_status DEFAULT 'design' NOT NULL,
    calculated_cost NUMERIC DEFAULT 0.0 NOT NULL,
    settings_json JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE public.tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    priority task_priority DEFAULT 'medium' NOT NULL,
    status task_status DEFAULT 'pending' NOT NULL,
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Row-Level Security Enablement
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs_3d_print ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs_outdoor_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- 4. Helper Function to Check User Role
CREATE OR REPLACE FUNCTION public.check_user_role(allowed_roles user_role[])
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = ANY(allowed_roles)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. Define Security Policies

-- Profiles Policies
CREATE POLICY "Profiles are readable by authenticated users" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins have full control over profiles" ON public.profiles
  FOR ALL TO authenticated USING (
    public.check_user_role(ARRAY['admin'::public.user_role])
  );

CREATE POLICY "Users can update their own profile text" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Clients Policies
CREATE POLICY "Admins and Managers can manage clients" ON public.clients
  FOR ALL TO authenticated
  USING (public.check_user_role(ARRAY['admin'::user_role, 'manager'::user_role]))
  WITH CHECK (public.check_user_role(ARRAY['admin'::user_role, 'manager'::user_role]));

CREATE POLICY "Technicians can read clients" ON public.clients
  FOR SELECT TO authenticated
  USING (public.check_user_role(ARRAY['admin'::user_role, 'manager'::user_role, 'technician'::user_role]));

-- Deals Policies
CREATE POLICY "Admins and Managers can manage deals" ON public.deals
  FOR ALL TO authenticated
  USING (public.check_user_role(ARRAY['admin'::user_role, 'manager'::user_role]))
  WITH CHECK (public.check_user_role(ARRAY['admin'::user_role, 'manager'::user_role]));

CREATE POLICY "Technicians can read deals" ON public.deals
  FOR SELECT TO authenticated
  USING (public.check_user_role(ARRAY['admin'::user_role, 'manager'::user_role, 'technician'::user_role]));

-- 3D Print Jobs Policies
CREATE POLICY "Admins and Managers can manage 3d print jobs" ON public.jobs_3d_print
  FOR ALL TO authenticated
  USING (public.check_user_role(ARRAY['admin'::user_role, 'manager'::user_role]))
  WITH CHECK (public.check_user_role(ARRAY['admin'::user_role, 'manager'::user_role]));

CREATE POLICY "Technicians can read 3d print jobs" ON public.jobs_3d_print
  FOR SELECT TO authenticated
  USING (public.check_user_role(ARRAY['admin'::user_role, 'manager'::user_role, 'technician'::user_role]));

CREATE POLICY "Technicians can update 3d print jobs status" ON public.jobs_3d_print
  FOR UPDATE TO authenticated
  USING (public.check_user_role(ARRAY['admin'::user_role, 'manager'::user_role, 'technician'::user_role]))
  WITH CHECK (true);

-- Outdoor Ad Jobs Policies
CREATE POLICY "Admins and Managers can manage outdoor ad jobs" ON public.jobs_outdoor_ads
  FOR ALL TO authenticated
  USING (public.check_user_role(ARRAY['admin'::user_role, 'manager'::user_role]))
  WITH CHECK (public.check_user_role(ARRAY['admin'::user_role, 'manager'::user_role]));

CREATE POLICY "Technicians can read outdoor ad jobs" ON public.jobs_outdoor_ads
  FOR SELECT TO authenticated
  USING (public.check_user_role(ARRAY['admin'::user_role, 'manager'::user_role, 'technician'::user_role]));

CREATE POLICY "Technicians can update outdoor ad jobs status" ON public.jobs_outdoor_ads
  FOR UPDATE TO authenticated
  USING (public.check_user_role(ARRAY['admin'::user_role, 'manager'::user_role, 'technician'::user_role]))
  WITH CHECK (true);

-- Tasks Policies
CREATE POLICY "Admins and Managers can manage tasks" ON public.tasks
  FOR ALL TO authenticated
  USING (public.check_user_role(ARRAY['admin'::user_role, 'manager'::user_role]))
  WITH CHECK (public.check_user_role(ARRAY['admin'::user_role, 'manager'::user_role]));

CREATE POLICY "Technicians can read/write tasks assigned to them" ON public.tasks
  FOR ALL TO authenticated
  USING (
    public.check_user_role(ARRAY['admin'::user_role, 'manager'::user_role]) OR
    (public.check_user_role(ARRAY['technician'::user_role]) AND assigned_to = auth.uid())
  )
  WITH CHECK (
    public.check_user_role(ARRAY['admin'::user_role, 'manager'::user_role]) OR
    (public.check_user_role(ARRAY['technician'::user_role]) AND assigned_to = auth.uid())
  );

-- 6. Trigger to Automatically Create Profile on Auth Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    -- The first profile gets 'admin', others get 'pending'
    CASE 
      WHEN NOT EXISTS (SELECT 1 FROM public.profiles) THEN 'admin'::public.user_role
      ELSE 'pending'::public.user_role
    END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Inventory Items Table (Склад)
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

-- Enable RLS
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

-- Security Policies
CREATE POLICY "Inventory is readable by authenticated users" ON public.inventory_items
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins and Managers can manage inventory" ON public.inventory_items
  FOR ALL TO authenticated USING (
    public.check_user_role(ARRAY['admin'::user_role, 'manager'::user_role])
  )
  WITH CHECK (
    public.check_user_role(ARRAY['admin'::user_role, 'manager'::user_role])
  );

-- Populate default materials
INSERT INTO public.inventory_items (name, category, item_type, stock_quantity, unit, price_per_unit) VALUES
('PLA Plastic (Standard)', '3d_print', 'filament', 10, 'kg', 1500),
('PETG Plastic (Strong)', '3d_print', 'filament', 5, 'kg', 1800),
('ABS Plastic (Heat-Resistant)', '3d_print', 'filament', 4, 'kg', 1700),
('TPU Plastic (Flexible)', '3d_print', 'filament', 2, 'kg', 3500),
('Nylon Plastic (Engineering)', '3d_print', 'filament', 1, 'kg', 4000),
('Frontlit Banner 440g', 'outdoor_ads', 'banner_mat', 150, 'sqm', 500),
('Backlit Banner 510g', 'outdoor_ads', 'banner_mat', 80, 'sqm', 800),
('Standard Eyelet 12mm', 'outdoor_ads', 'eyelet', 2000, 'pcs', 15),
('Reinforced Eyelet 16mm', 'outdoor_ads', 'eyelet', 1000, 'pcs', 25),
('Edge Welding Tape', 'outdoor_ads', 'edge_tape', 500, 'meters', 100),
('Metal Square Tube 20x20mm', 'outdoor_ads', 'frame_pipe', 120, 'meters', 300),
('Metal Square Tube 40x20mm', 'outdoor_ads', 'frame_pipe', 90, 'meters', 450),
('Acrylic Glass 3mm (White)', 'outdoor_ads', 'face_mat', 40, 'sqm', 3000),
('Polycarbonate 4mm (Translucent)', 'outdoor_ads', 'face_mat', 60, 'sqm', 2200),
('Aluminum Profile 130mm', 'outdoor_ads', 'side_profile', 180, 'meters', 800),
('Plastic Side Profile 100mm', 'outdoor_ads', 'side_profile', 100, 'meters', 550),
('LED Module SMD 2835 1.2W', 'outdoor_ads', 'led_module', 500, 'pcs', 45),
('LED Module SMD 5730 1.5W', 'outdoor_ads', 'led_module', 300, 'pcs', 60),
('Power Supply IP67 12V 100W', 'outdoor_ads', 'power_supply', 15, 'pcs', 1200),
('Power Supply IP67 12V 250W', 'outdoor_ads', 'power_supply', 10, 'pcs', 2400);
