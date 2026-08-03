-- La columna role mezcla dos cosas: el tipo de usuario que se elige en el
-- onboarding (usuario, rescatista, organizacion, veterinario) y el permiso de
-- administración. Por eso, una cuenta admin que completa el onboarding se
-- degradaba sola al elegir su tipo de usuario.
--
-- Hasta que se separen en dos columnas, este trigger conserva el rol admin
-- frente a cualquier escritura hecha desde la app. Para asignarlo o quitarlo
-- hay que hacerlo con el service role o desde el panel de Supabase.

-- Sin SECURITY DEFINER a propósito: dentro de una función definer, current_user
-- es la persona dueña de la función y no quien ejecuta la consulta, con lo cual
-- la comprobación de abajo nunca se cumpliría. Esta función solo modifica NEW,
-- así que no necesita privilegios elevados.
CREATE OR REPLACE FUNCTION public.preservar_rol_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF OLD.role = 'admin'
     AND NEW.role IS DISTINCT FROM 'admin'
     AND current_user NOT IN ('postgres', 'supabase_admin', 'service_role')
  THEN
    NEW.role := 'admin';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_role_update ON public.profiles;
CREATE TRIGGER on_profile_role_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.preservar_rol_admin();
