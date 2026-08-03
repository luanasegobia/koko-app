-- La columna role mezclaba dos conceptos independientes: qué clase de cuenta
-- es (lo que la persona elige en el onboarding) y si tiene permisos de
-- administración. Por eso hacía falta un trigger para que completar el perfil
-- no degradara a quien administra.
--
-- Se separan en tipo_cuenta y es_admin, y se elimina role.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tipo_cuenta TEXT NOT NULL DEFAULT 'usuario';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS es_admin BOOLEAN NOT NULL DEFAULT false;

UPDATE public.profiles
SET tipo_cuenta = CASE WHEN role = 'admin' THEN 'usuario' ELSE COALESCE(role, 'usuario') END,
    es_admin = (role = 'admin');

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_tipo_cuenta_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_tipo_cuenta_check
  CHECK (tipo_cuenta IN ('usuario', 'rescatista', 'organizacion', 'veterinario'));

-- ---------------------------------------------------------------------------
-- Función de permiso, ahora sobre la columna booleana
-- ---------------------------------------------------------------------------
-- Sigue siendo SECURITY DEFINER para no reintroducir la recursión de RLS.
CREATE OR REPLACE FUNCTION public.es_administrador()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid()) AND p.es_admin = true
  );
$$;

-- El linter de Supabase avisa que una función SECURITY DEFINER queda expuesta
-- como RPC. Es inevitable y aceptable acá: las políticas la ejecutan con el rol
-- de quien consulta, así que necesita el permiso, y lo único que devuelve es un
-- booleano sobre la propia persona autenticada.
GRANT EXECUTE ON FUNCTION public.es_administrador() TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- Políticas: se repuntan todas a la función nueva
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (id = (SELECT auth.uid()) OR public.es_administrador());

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (
    id = (SELECT auth.uid())
    AND (COALESCE(es_admin, false) = false OR public.es_administrador())
  );

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (id = (SELECT auth.uid()))
  WITH CHECK (
    id = (SELECT auth.uid())
    AND (COALESCE(es_admin, false) = false OR public.es_administrador())
  );

DROP POLICY IF EXISTS "pet_update_owner_admin" ON public.pet;
CREATE POLICY "pet_update_owner_admin" ON public.pet
  FOR UPDATE USING (created_by_id = (SELECT auth.uid()) OR public.es_administrador());
DROP POLICY IF EXISTS "pet_delete_owner_admin" ON public.pet;
CREATE POLICY "pet_delete_owner_admin" ON public.pet
  FOR DELETE USING (created_by_id = (SELECT auth.uid()) OR public.es_administrador());

DROP POLICY IF EXISTS "lost_pet_update_owner_admin" ON public.lost_pet;
CREATE POLICY "lost_pet_update_owner_admin" ON public.lost_pet
  FOR UPDATE USING (created_by_id = (SELECT auth.uid()) OR public.es_administrador());
DROP POLICY IF EXISTS "lost_pet_delete_owner_admin" ON public.lost_pet;
CREATE POLICY "lost_pet_delete_owner_admin" ON public.lost_pet
  FOR DELETE USING (created_by_id = (SELECT auth.uid()) OR public.es_administrador());

DROP POLICY IF EXISTS "adoption_pet_update_owner_admin" ON public.adoption_pet;
CREATE POLICY "adoption_pet_update_owner_admin" ON public.adoption_pet
  FOR UPDATE USING (created_by_id = (SELECT auth.uid()) OR public.es_administrador());
DROP POLICY IF EXISTS "adoption_pet_delete_owner_admin" ON public.adoption_pet;
CREATE POLICY "adoption_pet_delete_owner_admin" ON public.adoption_pet
  FOR DELETE USING (created_by_id = (SELECT auth.uid()) OR public.es_administrador());

DROP POLICY IF EXISTS "veterinary_select_verified" ON public.veterinary;
CREATE POLICY "veterinary_select_verified" ON public.veterinary
  FOR SELECT USING (
    is_verified = true
    OR registered_by_user_id = (SELECT auth.uid())
    OR public.es_administrador()
  );
DROP POLICY IF EXISTS "veterinary_update_owner_admin" ON public.veterinary;
CREATE POLICY "veterinary_update_owner_admin" ON public.veterinary
  FOR UPDATE USING (registered_by_user_id = (SELECT auth.uid()) OR public.es_administrador());
DROP POLICY IF EXISTS "veterinary_delete_admin" ON public.veterinary;
CREATE POLICY "veterinary_delete_admin" ON public.veterinary
  FOR DELETE USING (public.es_administrador());

DROP POLICY IF EXISTS "urgent_case_update_owner_admin" ON public.urgent_case;
CREATE POLICY "urgent_case_update_owner_admin" ON public.urgent_case
  FOR UPDATE USING (created_by_id = (SELECT auth.uid()) OR public.es_administrador());
DROP POLICY IF EXISTS "urgent_case_delete_owner_admin" ON public.urgent_case;
CREATE POLICY "urgent_case_delete_owner_admin" ON public.urgent_case
  FOR DELETE USING (created_by_id = (SELECT auth.uid()) OR public.es_administrador());

DROP POLICY IF EXISTS "abuse_report_update_owner_admin" ON public.abuse_report;
CREATE POLICY "abuse_report_update_owner_admin" ON public.abuse_report
  FOR UPDATE USING (created_by_id = (SELECT auth.uid()) OR public.es_administrador());
DROP POLICY IF EXISTS "abuse_report_delete_admin" ON public.abuse_report;
CREATE POLICY "abuse_report_delete_admin" ON public.abuse_report
  FOR DELETE USING (public.es_administrador());

DROP POLICY IF EXISTS "chat_message_update_sender_admin" ON public.chat_message;
CREATE POLICY "chat_message_update_sender_admin" ON public.chat_message
  FOR UPDATE USING (sender_id = (SELECT auth.uid())::text OR public.es_administrador());
DROP POLICY IF EXISTS "chat_message_delete_sender_admin" ON public.chat_message;
CREATE POLICY "chat_message_delete_sender_admin" ON public.chat_message
  FOR DELETE USING (sender_id = (SELECT auth.uid())::text OR public.es_administrador());

DROP POLICY IF EXISTS "app_notification_select_own" ON public.app_notification;
CREATE POLICY "app_notification_select_own" ON public.app_notification
  FOR SELECT USING (user_id = (SELECT auth.uid()) OR public.es_administrador());
DROP POLICY IF EXISTS "app_notification_update_own" ON public.app_notification;
CREATE POLICY "app_notification_update_own" ON public.app_notification
  FOR UPDATE USING (user_id = (SELECT auth.uid()) OR public.es_administrador());
DROP POLICY IF EXISTS "app_notification_delete_admin" ON public.app_notification;
CREATE POLICY "app_notification_delete_admin" ON public.app_notification
  FOR DELETE USING (public.es_administrador());

DROP POLICY IF EXISTS "alert_subscription_select_own" ON public.alert_subscription;
CREATE POLICY "alert_subscription_select_own" ON public.alert_subscription
  FOR SELECT USING (user_id = (SELECT auth.uid()) OR public.es_administrador());

-- ---------------------------------------------------------------------------
-- Trigger de resguardo sobre la columna booleana
-- ---------------------------------------------------------------------------
-- Sin SECURITY DEFINER: dentro de una función definer, current_user es quien
-- posee la función y no quien ejecuta la consulta.
CREATE OR REPLACE FUNCTION public.preservar_es_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF OLD.es_admin = true
     AND NEW.es_admin = false
     AND current_user NOT IN ('postgres', 'supabase_admin', 'service_role')
  THEN
    NEW.es_admin := true;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_role_update ON public.profiles;
DROP TRIGGER IF EXISTS on_profile_admin_update ON public.profiles;
CREATE TRIGGER on_profile_admin_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.preservar_es_admin();

DROP FUNCTION IF EXISTS public.preservar_rol_admin();

-- ---------------------------------------------------------------------------
-- Permisos por columna y baja de role
-- ---------------------------------------------------------------------------
-- tipo_cuenta se elige en el onboarding; es_admin queda fuera del alcance del
-- cliente, igual que antes estaba el valor 'admin' de role.
REVOKE INSERT, UPDATE ON public.profiles FROM anon, authenticated;

GRANT INSERT (id, email, full_name, phone, avatar_url, profile_completed,
              bio, location, organization_name, tipo_cuenta, created_at, updated_at)
  ON public.profiles TO authenticated;

GRANT UPDATE (id, email, full_name, phone, avatar_url, profile_completed,
              bio, location, organization_name, tipo_cuenta, updated_at)
  ON public.profiles TO authenticated;

DROP FUNCTION IF EXISTS public.es_admin();
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;
