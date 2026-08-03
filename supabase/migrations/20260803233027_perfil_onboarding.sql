-- El formulario de onboarding (CompleteProfile) guarda bio, location y
-- organization_name, que no existían en profiles, y usa los roles en español
-- que muestra RoleSelector, mientras que el CHECK original solo aceptaba los
-- valores en inglés. El resultado era que completar el perfil fallaba y la
-- persona quedaba atrapada en el onboarding.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS organization_name TEXT;

-- Roles en español, alineados con RoleSelector y con la regla del proyecto de
-- mantener todo en español. 'admin' se conserva porque es el que consultan
-- es_admin() y el panel de administración.
-- Primero se suelta el CHECK viejo: si no, los UPDATE de abajo lo violan.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

UPDATE public.profiles SET role = 'usuario' WHERE role = 'user';
UPDATE public.profiles SET role = 'rescatista' WHERE role = 'rescuer';
UPDATE public.profiles SET role = 'organizacion' WHERE role = 'org';
UPDATE public.profiles SET role = 'veterinario' WHERE role = 'veterinarian';

ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('usuario', 'rescatista', 'organizacion', 'veterinario', 'admin'));

ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'usuario';

-- Cada persona elige su propio rol en el onboarding, así que se le devuelve el
-- permiso de escritura sobre la columna. Lo que no puede es asignarse 'admin':
-- eso lo bloquean los WITH CHECK de más abajo.
GRANT INSERT (id, email, full_name, phone, avatar_url, profile_completed,
              bio, location, organization_name, role, created_at, updated_at)
  ON public.profiles TO authenticated;

GRANT UPDATE (id, email, full_name, phone, avatar_url, profile_completed,
              bio, location, organization_name, role, updated_at)
  ON public.profiles TO authenticated;

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (
    id = (SELECT auth.uid())
    AND (COALESCE(role, 'usuario') <> 'admin' OR public.es_admin())
  );

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (id = (SELECT auth.uid()))
  WITH CHECK (
    id = (SELECT auth.uid())
    AND (COALESCE(role, 'usuario') <> 'admin' OR public.es_admin())
  );
