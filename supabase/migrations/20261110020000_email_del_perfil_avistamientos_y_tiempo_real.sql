-- Tres pendientes chicos de la revisión de seguridad:
--
--   1. Una persona podía escribir cualquier email en su propio perfil.
--   2. Los avistamientos se pueden cargar sin sesión y no tenían freno por
--      tiempo: un script podía llenar una publicación de avisos falsos.
--   3. El chat y las notificaciones en vivo no recibían nada aunque se
--      activaran, porque sus tablas no estaban publicadas para tiempo real.

-- ---------------------------------------------------------------------------
-- 1. El email del perfil es el de la sesión, no el que mande el navegador
-- ---------------------------------------------------------------------------
-- profiles.email es una copia del email de la cuenta, que es lo que ve
-- administración. El permiso por columna deja escribirla porque el cliente la
-- manda en cada upsert, así que se resuelve con un trigger que pisa el valor
-- con el de la sesión. Quitar el permiso rompería ese upsert.
--
-- Sin SECURITY DEFINER: dentro de una función definer, current_user es quien
-- posee la función y no quien ejecuta la consulta.
CREATE OR REPLACE FUNCTION public.fijar_email_del_perfil()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  email_de_sesion TEXT := NULLIF((SELECT auth.jwt()) ->> 'email', '');
BEGIN
  -- El alta de la cuenta (handle_new_user) y las tareas de administración de la
  -- base corren con estos roles y sí pueden fijar el email.
  IF current_user IN ('postgres', 'supabase_admin', 'service_role') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    NEW.email := COALESCE(email_de_sesion, OLD.email);
  ELSE
    NEW.email := email_de_sesion;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.fijar_email_del_perfil() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_profile_email ON public.profiles;
CREATE TRIGGER on_profile_email
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.fijar_email_del_perfil();

-- ---------------------------------------------------------------------------
-- 2. Avistamientos: tope por tiempo además del tope total
-- ---------------------------------------------------------------------------
-- Misma función y misma firma que en la migración anterior; se agregan el freno
-- de cinco avisos cada diez minutos por publicación y una defensa contra un
-- sightings que no sea una lista.
CREATE OR REPLACE FUNCTION public.agregar_avistamiento(
  id_mascota UUID,
  direccion TEXT,
  nota TEXT DEFAULT NULL,
  lat NUMERIC DEFAULT NULL,
  lng NUMERIC DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  avistamientos JSONB;
  recientes INTEGER;
BEGIN
  direccion := btrim(COALESCE(direccion, ''));
  nota      := btrim(COALESCE(nota, ''));

  IF direccion = '' THEN
    RAISE EXCEPTION 'Hay que indicar dónde viste a la mascota.' USING ERRCODE = 'check_violation';
  END IF;
  IF length(direccion) > 200 THEN
    RAISE EXCEPTION 'La ubicación no puede superar los 200 caracteres.' USING ERRCODE = 'check_violation';
  END IF;
  IF length(nota) > 500 THEN
    RAISE EXCEPTION 'La nota no puede superar los 500 caracteres.' USING ERRCODE = 'check_violation';
  END IF;

  -- Las coordenadas son opcionales, pero si vienen tienen que ser válidas y
  -- venir las dos: media coordenada no ubica nada en el mapa.
  IF (lat IS NULL) <> (lng IS NULL) THEN
    RAISE EXCEPTION 'Las coordenadas tienen que venir completas.' USING ERRCODE = 'check_violation';
  END IF;
  IF lat IS NOT NULL AND (lat < -90 OR lat > 90 OR lng < -180 OR lng > 180) THEN
    RAISE EXCEPTION 'Las coordenadas están fuera de rango.' USING ERRCODE = 'check_violation';
  END IF;

  SELECT COALESCE(lp.sightings, '[]'::jsonb)
    INTO avistamientos
    FROM public.lost_pet lp
   WHERE lp.id = id_mascota
     FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No encontramos esa publicación.' USING ERRCODE = 'no_data_found';
  END IF;

  -- sightings es JSONB sin restricción de forma: si quedó algo que no es una
  -- lista, se arranca de cero en vez de fallar con un error indescifrable.
  IF jsonb_typeof(avistamientos) <> 'array' THEN
    avistamientos := '[]'::jsonb;
  END IF;

  -- Tope defensivo: la función es invocable sin sesión, así que sin límite el
  -- arreglo podría crecer sin control.
  IF jsonb_array_length(avistamientos) >= 50 THEN
    RAISE EXCEPTION 'Esta publicación ya alcanzó el máximo de avistamientos.' USING ERRCODE = 'check_violation';
  END IF;

  -- Freno por tiempo: cinco avisos en diez minutos alcanzan para un caso real y
  -- cortan a quien los manda en serie. El CASE evita convertir a fecha un valor
  -- que no tenga forma de fecha.
  SELECT count(*)
    INTO recientes
    FROM jsonb_array_elements(avistamientos) AS a
   WHERE CASE
           WHEN a ->> 'date' ~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}'
           THEN (a ->> 'date')::timestamptz > now() - interval '10 minutes'
           ELSE false
         END;

  IF recientes >= 5 THEN
    RAISE EXCEPTION 'Esta publicación recibió muchos avisos seguidos. Probá de nuevo en unos minutos.'
      USING ERRCODE = 'check_violation';
  END IF;

  avistamientos := avistamientos || jsonb_build_object(
    'address',     direccion,
    'note',        NULLIF(nota, ''),
    'lat',         lat,
    'lng',         lng,
    'date',        to_char(now() AT TIME ZONE 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
    'reported_by', (SELECT auth.uid())
  );

  UPDATE public.lost_pet SET sightings = avistamientos WHERE id = id_mascota;

  RETURN avistamientos;
END;
$$;

-- CREATE OR REPLACE conserva los permisos, pero se repiten para que la
-- migración se pueda leer sola.
GRANT EXECUTE ON FUNCTION public.agregar_avistamiento(UUID, TEXT, TEXT, NUMERIC, NUMERIC) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. Tiempo real: publicar las tablas que escucha la app
-- ---------------------------------------------------------------------------
-- La app se suscribe a los cambios de chat_message y app_notification cuando se
-- activa HABILITAR_TIEMPO_REAL, pero Supabase solo emite cambios de las tablas
-- incluidas en la publicación supabase_realtime. Las políticas de lectura se
-- siguen aplicando: cada quien recibe solo las filas que puede leer.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'chat_message'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_message;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'app_notification'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.app_notification;
  END IF;
END;
$$;
