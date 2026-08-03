-- Las políticas resolvían "¿es admin?" con un subquery sobre public.profiles.
-- Cuando esa comprobación se evalúa sobre la propia tabla profiles, vuelve a
-- disparar la misma política y PostgreSQL aborta con:
--   42P17: infinite recursion detected in policy for relation "profiles"
-- Eso rompía la lectura del perfil (y por lo tanto el rol admin) en toda la app.
--
-- Se reemplaza el subquery por una función SECURITY DEFINER, que lee el rol
-- sin volver a pasar por RLS y corta la recursión.

CREATE OR REPLACE FUNCTION public.es_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid()) AND role = 'admin'
  );
$$;

-- Las políticas la ejecutan con el rol de quien consulta, así que necesita el
-- permiso. Solo devuelve un booleano sobre la persona autenticada: con anon,
-- auth.uid() es NULL y el resultado es false.
GRANT EXECUTE ON FUNCTION public.es_admin() TO anon, authenticated;

-- Profiles
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (id = (SELECT auth.uid()) OR public.es_admin());

-- Pet
DROP POLICY IF EXISTS "pet_update_owner_admin" ON public.pet;
CREATE POLICY "pet_update_owner_admin" ON public.pet
  FOR UPDATE USING (created_by_id = (SELECT auth.uid()) OR public.es_admin());
DROP POLICY IF EXISTS "pet_delete_owner_admin" ON public.pet;
CREATE POLICY "pet_delete_owner_admin" ON public.pet
  FOR DELETE USING (created_by_id = (SELECT auth.uid()) OR public.es_admin());

-- Lost pet
DROP POLICY IF EXISTS "lost_pet_update_owner_admin" ON public.lost_pet;
CREATE POLICY "lost_pet_update_owner_admin" ON public.lost_pet
  FOR UPDATE USING (created_by_id = (SELECT auth.uid()) OR public.es_admin());
DROP POLICY IF EXISTS "lost_pet_delete_owner_admin" ON public.lost_pet;
CREATE POLICY "lost_pet_delete_owner_admin" ON public.lost_pet
  FOR DELETE USING (created_by_id = (SELECT auth.uid()) OR public.es_admin());

-- Adoption pet
DROP POLICY IF EXISTS "adoption_pet_update_owner_admin" ON public.adoption_pet;
CREATE POLICY "adoption_pet_update_owner_admin" ON public.adoption_pet
  FOR UPDATE USING (created_by_id = (SELECT auth.uid()) OR public.es_admin());
DROP POLICY IF EXISTS "adoption_pet_delete_owner_admin" ON public.adoption_pet;
CREATE POLICY "adoption_pet_delete_owner_admin" ON public.adoption_pet
  FOR DELETE USING (created_by_id = (SELECT auth.uid()) OR public.es_admin());

-- Veterinary
DROP POLICY IF EXISTS "veterinary_select_verified" ON public.veterinary;
CREATE POLICY "veterinary_select_verified" ON public.veterinary
  FOR SELECT USING (
    is_verified = true
    OR registered_by_user_id = (SELECT auth.uid())
    OR public.es_admin()
  );
DROP POLICY IF EXISTS "veterinary_update_owner_admin" ON public.veterinary;
CREATE POLICY "veterinary_update_owner_admin" ON public.veterinary
  FOR UPDATE USING (registered_by_user_id = (SELECT auth.uid()) OR public.es_admin());
DROP POLICY IF EXISTS "veterinary_delete_admin" ON public.veterinary;
CREATE POLICY "veterinary_delete_admin" ON public.veterinary
  FOR DELETE USING (public.es_admin());

-- Urgent case
DROP POLICY IF EXISTS "urgent_case_update_owner_admin" ON public.urgent_case;
CREATE POLICY "urgent_case_update_owner_admin" ON public.urgent_case
  FOR UPDATE USING (created_by_id = (SELECT auth.uid()) OR public.es_admin());
DROP POLICY IF EXISTS "urgent_case_delete_owner_admin" ON public.urgent_case;
CREATE POLICY "urgent_case_delete_owner_admin" ON public.urgent_case
  FOR DELETE USING (created_by_id = (SELECT auth.uid()) OR public.es_admin());

-- Abuse report
DROP POLICY IF EXISTS "abuse_report_update_owner_admin" ON public.abuse_report;
CREATE POLICY "abuse_report_update_owner_admin" ON public.abuse_report
  FOR UPDATE USING (created_by_id = (SELECT auth.uid()) OR public.es_admin());
DROP POLICY IF EXISTS "abuse_report_delete_admin" ON public.abuse_report;
CREATE POLICY "abuse_report_delete_admin" ON public.abuse_report
  FOR DELETE USING (public.es_admin());

-- Chat message
DROP POLICY IF EXISTS "chat_message_update_sender_admin" ON public.chat_message;
CREATE POLICY "chat_message_update_sender_admin" ON public.chat_message
  FOR UPDATE USING (sender_id = (SELECT auth.uid())::text OR public.es_admin());
DROP POLICY IF EXISTS "chat_message_delete_sender_admin" ON public.chat_message;
CREATE POLICY "chat_message_delete_sender_admin" ON public.chat_message
  FOR DELETE USING (sender_id = (SELECT auth.uid())::text OR public.es_admin());

-- App notification
DROP POLICY IF EXISTS "app_notification_select_own" ON public.app_notification;
CREATE POLICY "app_notification_select_own" ON public.app_notification
  FOR SELECT USING (user_id = (SELECT auth.uid()) OR public.es_admin());
DROP POLICY IF EXISTS "app_notification_update_own" ON public.app_notification;
CREATE POLICY "app_notification_update_own" ON public.app_notification
  FOR UPDATE USING (user_id = (SELECT auth.uid()) OR public.es_admin());
DROP POLICY IF EXISTS "app_notification_delete_admin" ON public.app_notification;
CREATE POLICY "app_notification_delete_admin" ON public.app_notification
  FOR DELETE USING (public.es_admin());

-- Alert subscription
DROP POLICY IF EXISTS "alert_subscription_select_own" ON public.alert_subscription;
CREATE POLICY "alert_subscription_select_own" ON public.alert_subscription
  FOR SELECT USING (user_id = (SELECT auth.uid()) OR public.es_admin());
