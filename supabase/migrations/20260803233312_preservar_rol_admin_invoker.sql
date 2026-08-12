-- Registro histórico. Esta migración ya estaba aplicada en la base de
-- desarrollo pero le faltaba el archivo en el repositorio, así que
-- `supabase migration list` mostraba una diferencia entre ambos lados.
--
-- Qué hizo en su momento: volver a crear preservar_rol_admin() SIN
-- SECURITY DEFINER. Con SECURITY DEFINER, current_user es quien posee la
-- función y no quien ejecuta la consulta, de modo que la comparación contra
-- 'postgres' / 'supabase_admin' / 'service_role' nunca se cumplía y el
-- resguardo no protegía nada.
--
-- La corrección ya quedó incorporada dentro de
-- 20260803233240_preservar_rol_admin.sql, así que sobre un proyecto nuevo esto
-- es una operación sin efecto: se conserva solo para que el historial del repo
-- coincida con el de la base. Dos migraciones más adelante
-- (20260803234227_separar_tipo_cuenta_y_admin.sql) la función se elimina junto
-- con la columna role.

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
