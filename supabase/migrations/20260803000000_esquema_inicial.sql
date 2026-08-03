-- Conectando Huellas - Koko App
-- Esquema completo de base de datos para Supabase
-- Pegar esto en el SQL Editor de Supabase

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'rescuer', 'org', 'veterinarian', 'admin')),
  avatar_url TEXT,
  profile_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Digital Pet IDs
CREATE TABLE IF NOT EXISTS public.pet (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  species TEXT NOT NULL CHECK (species IN ('perro', 'gato', 'otro')),
  breed TEXT,
  age_years NUMERIC,
  sex TEXT CHECK (sex IN ('macho', 'hembra')),
  photo_url TEXT,
  description TEXT,
  allergies TEXT,
  owner_name TEXT,
  owner_phone TEXT,
  owner_whatsapp TEXT,
  qr_id TEXT UNIQUE,
  created_by_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Lost pets
CREATE TABLE IF NOT EXISTS public.lost_pet (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pet_name TEXT NOT NULL,
  species TEXT NOT NULL CHECK (species IN ('perro', 'gato', 'otro')),
  breed TEXT,
  age_years NUMERIC,
  photo_url TEXT,
  description TEXT,
  last_seen_address TEXT,
  last_seen_lat NUMERIC,
  last_seen_lng NUMERIC,
  contact_phone TEXT,
  contact_whatsapp TEXT,
  status TEXT DEFAULT 'perdida' CHECK (status IN ('perdida', 'encontrada')),
  sightings JSONB DEFAULT '[]'::jsonb,
  created_by_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Adoption pets
CREATE TABLE IF NOT EXISTS public.adoption_pet (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  species TEXT NOT NULL CHECK (species IN ('perro', 'gato', 'otro')),
  breed TEXT,
  age_years NUMERIC,
  sex TEXT CHECK (sex IN ('macho', 'hembra')),
  size TEXT CHECK (size IN ('pequeño', 'mediano', 'grande')),
  photo_url TEXT,
  description TEXT,
  vaccinated BOOLEAN DEFAULT false,
  sterilized BOOLEAN DEFAULT false,
  contact_name TEXT,
  contact_phone TEXT,
  location TEXT,
  status TEXT DEFAULT 'disponible' CHECK (status IN ('disponible', 'en_proceso', 'adoptado')),
  created_by_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Veterinaries
CREATE TABLE IF NOT EXISTS public.veterinary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  lat NUMERIC,
  lng NUMERIC,
  is_emergency BOOLEAN DEFAULT false,
  schedule JSONB DEFAULT '[]'::jsonb,
  services TEXT,
  bio TEXT,
  is_verified BOOLEAN DEFAULT false,
  registered_by_user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Urgent cases
CREATE TABLE IF NOT EXISTS public.urgent_case (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  photo_url TEXT,
  published_by TEXT,
  goal_amount NUMERIC DEFAULT 0,
  raised_amount NUMERIC DEFAULT 0,
  contributors_count INTEGER DEFAULT 0,
  donation_alias TEXT,
  needs JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'activo' CHECK (status IN ('activo', 'en_curso', 'resuelto')),
  created_by_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Abuse reports
CREATE TABLE IF NOT EXISTS public.abuse_report (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('urgente', 'regular', 'anonima')),
  description TEXT NOT NULL,
  address TEXT,
  lat NUMERIC,
  lng NUMERIC,
  evidence_urls JSONB DEFAULT '[]'::jsonb,
  reporter_name TEXT,
  reporter_phone TEXT,
  tracking_code TEXT,
  status TEXT DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'en_revision', 'derivada', 'resuelta')),
  created_by_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Chat messages
CREATE TABLE IF NOT EXISTS public.chat_message (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id TEXT NOT NULL,
  context_type TEXT NOT NULL CHECK (context_type IN ('lost_pet', 'urgent_case', 'adoption')),
  context_id TEXT,
  context_title TEXT,
  sender_id TEXT NOT NULL,
  sender_name TEXT,
  text TEXT NOT NULL,
  read_by JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- App notifications
CREATE TABLE IF NOT EXISTS public.app_notification (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('lost_pet', 'urgent_case', 'sighting', 'abuse_report', 'chat_reply', 'case_update')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  ref_id TEXT,
  link TEXT,
  read BOOLEAN DEFAULT false,
  distance_km NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Alert subscriptions
CREATE TABLE IF NOT EXISTS public.alert_subscription (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT,
  lat NUMERIC,
  lng NUMERIC,
  radius_km NUMERIC DEFAULT 5,
  location_label TEXT,
  notify_lost_pets BOOLEAN DEFAULT true,
  notify_urgent_cases BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lost_pet_status ON public.lost_pet(status);
CREATE INDEX IF NOT EXISTS idx_lost_pet_species ON public.lost_pet(species);
CREATE INDEX IF NOT EXISTS idx_lost_pet_created ON public.lost_pet(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_adoption_pet_status ON public.adoption_pet(status);
CREATE INDEX IF NOT EXISTS idx_adoption_pet_species ON public.adoption_pet(species);
CREATE INDEX IF NOT EXISTS idx_urgent_case_status ON public.urgent_case(status);
CREATE INDEX IF NOT EXISTS idx_abuse_report_status ON public.abuse_report(status);
CREATE INDEX IF NOT EXISTS idx_abuse_report_tracking ON public.abuse_report(tracking_code);
CREATE INDEX IF NOT EXISTS idx_chat_message_conversation ON public.chat_message(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_message_created ON public.chat_message(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_app_notification_user ON public.app_notification(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alert_subscription_user ON public.alert_subscription(user_id);
CREATE INDEX IF NOT EXISTS idx_veterinary_verified ON public.veterinary(is_verified);

-- Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pet ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lost_pet ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adoption_pet ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.veterinary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.urgent_case ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abuse_report ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_message ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_notification ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_subscription ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/write own profile, admins can read all
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Pet: anyone can read, owner and admin can update/delete
CREATE POLICY "pet_select_all" ON public.pet FOR SELECT USING (true);
CREATE POLICY "pet_insert_auth" ON public.pet FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "pet_update_owner_admin" ON public.pet FOR UPDATE USING (created_by_id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "pet_delete_owner_admin" ON public.pet FOR DELETE USING (created_by_id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Lost pet: anyone can read/create, owner and admin can update/delete
CREATE POLICY "lost_pet_select_all" ON public.lost_pet FOR SELECT USING (true);
CREATE POLICY "lost_pet_insert_all" ON public.lost_pet FOR INSERT WITH CHECK (true);
CREATE POLICY "lost_pet_update_owner_admin" ON public.lost_pet FOR UPDATE USING (created_by_id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "lost_pet_delete_owner_admin" ON public.lost_pet FOR DELETE USING (created_by_id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Adoption pet: anyone can read, auth can create, owner/admin can update/delete
CREATE POLICY "adoption_pet_select_all" ON public.adoption_pet FOR SELECT USING (true);
CREATE POLICY "adoption_pet_insert_auth" ON public.adoption_pet FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "adoption_pet_update_owner_admin" ON public.adoption_pet FOR UPDATE USING (created_by_id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "adoption_pet_delete_owner_admin" ON public.adoption_pet FOR DELETE USING (created_by_id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Veterinary: anyone can read verified, vet owner and admin can update
CREATE POLICY "veterinary_select_verified" ON public.veterinary FOR SELECT USING (is_verified = true OR registered_by_user_id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "veterinary_insert_all" ON public.veterinary FOR INSERT WITH CHECK (true);
CREATE POLICY "veterinary_update_owner_admin" ON public.veterinary FOR UPDATE USING (registered_by_user_id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "veterinary_delete_admin" ON public.veterinary FOR DELETE USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Urgent case: anyone can read/create, owner and admin can update/delete
CREATE POLICY "urgent_case_select_all" ON public.urgent_case FOR SELECT USING (true);
CREATE POLICY "urgent_case_insert_all" ON public.urgent_case FOR INSERT WITH CHECK (true);
CREATE POLICY "urgent_case_update_owner_admin" ON public.urgent_case FOR UPDATE USING (created_by_id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "urgent_case_delete_owner_admin" ON public.urgent_case FOR DELETE USING (created_by_id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Abuse report: anyone can read/create, owner and admin can update
CREATE POLICY "abuse_report_select_all" ON public.abuse_report FOR SELECT USING (true);
CREATE POLICY "abuse_report_insert_all" ON public.abuse_report FOR INSERT WITH CHECK (true);
CREATE POLICY "abuse_report_update_owner_admin" ON public.abuse_report FOR UPDATE USING (created_by_id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "abuse_report_delete_admin" ON public.abuse_report FOR DELETE USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Chat message: anyone can read/create, sender and admin can update/delete
CREATE POLICY "chat_message_select_all" ON public.chat_message FOR SELECT USING (true);
CREATE POLICY "chat_message_insert_all" ON public.chat_message FOR INSERT WITH CHECK (true);
CREATE POLICY "chat_message_update_sender_admin" ON public.chat_message FOR UPDATE USING (sender_id = auth.uid()::text OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "chat_message_delete_sender_admin" ON public.chat_message FOR DELETE USING (sender_id = auth.uid()::text OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- App notification: user can read own, admin can read all, system creates
CREATE POLICY "app_notification_select_own" ON public.app_notification FOR SELECT USING (user_id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "app_notification_insert_system" ON public.app_notification FOR INSERT WITH CHECK (true);
CREATE POLICY "app_notification_update_own" ON public.app_notification FOR UPDATE USING (user_id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "app_notification_delete_admin" ON public.app_notification FOR DELETE USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Alert subscription: user can manage own, admin can read all
CREATE POLICY "alert_subscription_select_own" ON public.alert_subscription FOR SELECT USING (user_id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "alert_subscription_insert_own" ON public.alert_subscription FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "alert_subscription_update_own" ON public.alert_subscription FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "alert_subscription_delete_own" ON public.alert_subscription FOR DELETE USING (user_id = auth.uid());

-- Storage bucket for uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('public-files', 'public-files', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "storage_select_public" ON storage.objects FOR SELECT USING (bucket_id = 'public-files');
CREATE POLICY "storage_insert_auth" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'public-files' AND auth.role() = 'authenticated');
CREATE POLICY "storage_update_auth" ON storage.objects FOR UPDATE USING (bucket_id = 'public-files' AND auth.role() = 'authenticated');
CREATE POLICY "storage_delete_owner" ON storage.objects FOR DELETE USING (bucket_id = 'public-files' AND owner = auth.uid());

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
