-- La política profiles_update_own permite que cada persona edite su propia
-- fila, pero eso incluía la columna role: cualquiera podía ascenderse a admin
-- con un solo update. Los permisos por columna cierran esa vía sin romper la
-- edición del resto del perfil.

REVOKE INSERT, UPDATE ON public.profiles FROM anon, authenticated;

GRANT INSERT (id, email, full_name, phone, avatar_url, profile_completed, created_at, updated_at)
  ON public.profiles TO authenticated;

GRANT UPDATE (id, email, full_name, phone, avatar_url, profile_completed, updated_at)
  ON public.profiles TO authenticated;

-- El rol queda reservado para el service role y para quien administre la base
-- directamente desde el panel de Supabase.
