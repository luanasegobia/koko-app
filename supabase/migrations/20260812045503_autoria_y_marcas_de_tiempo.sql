-- Cierra el hueco central que dejó la migración desde Base44: nadie escribía
-- created_by_id.
--
-- Base44 completaba la autoría del lado del servidor. Al pasar a Supabase esa
-- pieza no se reemplazó, así que todas las filas quedaban con created_by_id en
-- NULL y las políticas de dueño (..._update_owner_admin, ..._delete_owner_admin)
-- nunca podían coincidir con nadie: en los hechos, ninguna persona podía editar
-- ni borrar lo suyo, y solo administración podía tocar algo.
--
-- Contiene además tres arreglos que dependen de lo mismo:
--   * el trigger que mantiene updated_at (la columna existía y nunca cambiaba),
--   * la función para cargar avistamientos sin ser dueño de la publicación,
--   * el código de seguimiento de denuncias, generado y único del lado del servidor.

-- ---------------------------------------------------------------------------
-- 1. La autoría la pone el servidor
-- ---------------------------------------------------------------------------
-- Se resuelve con DEFAULT y no con un trigger BEFORE INSERT a propósito: un
-- trigger descartaría en silencio lo que mande quien llama, y CompleteProfile
-- envía registered_by_user_id de forma deliberada al dar de alta una
-- veterinaria. Con DEFAULT ese código sigue funcionando, y si algún día
-- mandara un valor ajeno la política de abajo lo rechaza en vez de taparlo.

-- Sin envolver en (SELECT ...): PostgreSQL no admite subconsultas en una
-- expresión DEFAULT. Ese envoltorio sí se usa en las políticas de más abajo,
-- donde evita reevaluar auth.uid() fila por fila, pero acá es un error de
-- sintaxis (0A000).
ALTER TABLE public.pet          ALTER COLUMN created_by_id         SET DEFAULT auth.uid();
ALTER TABLE public.lost_pet     ALTER COLUMN created_by_id         SET DEFAULT auth.uid();
ALTER TABLE public.adoption_pet ALTER COLUMN created_by_id         SET DEFAULT auth.uid();
ALTER TABLE public.urgent_case  ALTER COLUMN created_by_id         SET DEFAULT auth.uid();
ALTER TABLE public.abuse_report ALTER COLUMN created_by_id         SET DEFAULT auth.uid();
ALTER TABLE public.veterinary   ALTER COLUMN registered_by_user_id SET DEFAULT auth.uid();

-- Las políticas de dueño filtran por estas columnas en cada UPDATE y DELETE.
CREATE INDEX IF NOT EXISTS idx_pet_created_by          ON public.pet (created_by_id);
CREATE INDEX IF NOT EXISTS idx_lost_pet_created_by     ON public.lost_pet (created_by_id);
CREATE INDEX IF NOT EXISTS idx_adoption_pet_created_by ON public.adoption_pet (created_by_id);
CREATE INDEX IF NOT EXISTS idx_urgent_case_created_by  ON public.urgent_case (created_by_id);
CREATE INDEX IF NOT EXISTS idx_abuse_report_created_by ON public.abuse_report (created_by_id);
CREATE INDEX IF NOT EXISTS idx_veterinary_registrada_por ON public.veterinary (registered_by_user_id);

-- ---------------------------------------------------------------------------
-- 2. Y si el cliente igual manda un valor, tiene que ser el suyo
-- ---------------------------------------------------------------------------
-- lost_pet, urgent_case y abuse_report tenían WITH CHECK (true). Como la clave
-- anónima es pública por diseño (viaja dentro del bundle del navegador),
-- cualquiera podía insertar una fila con el created_by_id de otra persona:
-- contenido atribuido a alguien que además podría borrarlo, mientras que quien
-- lo publicó no.
--
-- IS NOT DISTINCT FROM en lugar de = para que NULL = NULL sea verdadero y el
-- DEFAULT pueda actuar cuando el cliente no manda nada.
--
-- Se exige sesión iniciada: la interfaz nunca inserta sin login (denuncias vive
-- detrás de ProtectedRoute, y perdidas y casos urgentes redirigen al login), y
-- una fila anónima quedaría huérfana para siempre, sin nadie que pueda editarla.
-- La denuncia "anónima" del formulario oculta los datos de contacto, pero se
-- publica con sesión iniciada.

-- Se descartan tanto los nombres viejos como los nuevos, para que la migración
-- se pueda volver a ejecutar sin chocar con "policy already exists". Es la misma
-- convención que ya usa el esquema inicial.
DROP POLICY IF EXISTS "pet_insert_auth" ON public.pet;
DROP POLICY IF EXISTS "pet_insert_propio" ON public.pet;
CREATE POLICY "pet_insert_propio" ON public.pet
  FOR INSERT WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL
    AND created_by_id IS NOT DISTINCT FROM (SELECT auth.uid())
  );

DROP POLICY IF EXISTS "lost_pet_insert_all" ON public.lost_pet;
DROP POLICY IF EXISTS "lost_pet_insert_propio" ON public.lost_pet;
CREATE POLICY "lost_pet_insert_propio" ON public.lost_pet
  FOR INSERT WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL
    AND created_by_id IS NOT DISTINCT FROM (SELECT auth.uid())
  );

DROP POLICY IF EXISTS "adoption_pet_insert_auth" ON public.adoption_pet;
DROP POLICY IF EXISTS "adoption_pet_insert_propio" ON public.adoption_pet;
CREATE POLICY "adoption_pet_insert_propio" ON public.adoption_pet
  FOR INSERT WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL
    AND created_by_id IS NOT DISTINCT FROM (SELECT auth.uid())
  );

DROP POLICY IF EXISTS "urgent_case_insert_all" ON public.urgent_case;
DROP POLICY IF EXISTS "urgent_case_insert_propio" ON public.urgent_case;
CREATE POLICY "urgent_case_insert_propio" ON public.urgent_case
  FOR INSERT WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL
    AND created_by_id IS NOT DISTINCT FROM (SELECT auth.uid())
  );

DROP POLICY IF EXISTS "abuse_report_insert_all" ON public.abuse_report;
DROP POLICY IF EXISTS "abuse_report_insert_propio" ON public.abuse_report;
CREATE POLICY "abuse_report_insert_propio" ON public.abuse_report
  FOR INSERT WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL
    AND created_by_id IS NOT DISTINCT FROM (SELECT auth.uid())
  );

-- La veterinaria además sigue naciendo sin verificar: la verifica administración.
DROP POLICY IF EXISTS "veterinary_insert_all" ON public.veterinary;
DROP POLICY IF EXISTS "veterinary_insert_sin_verificar" ON public.veterinary;
DROP POLICY IF EXISTS "veterinary_insert_propia_sin_verificar" ON public.veterinary;
CREATE POLICY "veterinary_insert_propia_sin_verificar" ON public.veterinary
  FOR INSERT WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL
    AND registered_by_user_id IS NOT DISTINCT FROM (SELECT auth.uid())
    AND is_verified = false
  );

-- chat_message queda intencionalmente afuera: sender_id es TEXT y admite
-- invitados sin sesión (guest_<nombre>_<marca de tiempo>), que es como funciona
-- el chat rápido de las publicaciones. Tocar chat_message_insert_all rompería esa
-- función.

-- ---------------------------------------------------------------------------
-- 3. updated_at, que hasta ahora nunca se movía
-- ---------------------------------------------------------------------------
-- Las tablas tienen la columna con DEFAULT now(), pero ningún trigger la
-- actualizaba: el valor quedaba clavado en la fecha de creación. Sin esto,
-- ordenar o comparar por updated_at devuelve resultados que parecen correctos y
-- no lo son.

CREATE OR REPLACE FUNCTION public.tocar_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profiles_updated           ON public.profiles;
DROP TRIGGER IF EXISTS on_pet_updated                ON public.pet;
DROP TRIGGER IF EXISTS on_lost_pet_updated           ON public.lost_pet;
DROP TRIGGER IF EXISTS on_adoption_pet_updated       ON public.adoption_pet;
DROP TRIGGER IF EXISTS on_veterinary_updated         ON public.veterinary;
DROP TRIGGER IF EXISTS on_urgent_case_updated        ON public.urgent_case;
DROP TRIGGER IF EXISTS on_abuse_report_updated       ON public.abuse_report;
DROP TRIGGER IF EXISTS on_alert_subscription_updated ON public.alert_subscription;

CREATE TRIGGER on_profiles_updated           BEFORE UPDATE ON public.profiles           FOR EACH ROW EXECUTE FUNCTION public.tocar_updated_at();
CREATE TRIGGER on_pet_updated                BEFORE UPDATE ON public.pet                FOR EACH ROW EXECUTE FUNCTION public.tocar_updated_at();
CREATE TRIGGER on_lost_pet_updated           BEFORE UPDATE ON public.lost_pet           FOR EACH ROW EXECUTE FUNCTION public.tocar_updated_at();
CREATE TRIGGER on_adoption_pet_updated       BEFORE UPDATE ON public.adoption_pet       FOR EACH ROW EXECUTE FUNCTION public.tocar_updated_at();
CREATE TRIGGER on_veterinary_updated         BEFORE UPDATE ON public.veterinary         FOR EACH ROW EXECUTE FUNCTION public.tocar_updated_at();
CREATE TRIGGER on_urgent_case_updated        BEFORE UPDATE ON public.urgent_case        FOR EACH ROW EXECUTE FUNCTION public.tocar_updated_at();
CREATE TRIGGER on_abuse_report_updated       BEFORE UPDATE ON public.abuse_report       FOR EACH ROW EXECUTE FUNCTION public.tocar_updated_at();
CREATE TRIGGER on_alert_subscription_updated BEFORE UPDATE ON public.alert_subscription FOR EACH ROW EXECUTE FUNCTION public.tocar_updated_at();

-- chat_message y app_notification no tienen updated_at: son inmutables una vez creados.

-- ---------------------------------------------------------------------------
-- 4. Avistamientos: reportar que viste una mascota que no es tuya
-- ---------------------------------------------------------------------------
-- "La vi" hacía un UPDATE sobre lost_pet, pero esa tabla solo deja actualizar a
-- quien publicó (o a administración). O sea que la única persona habilitada a
-- avisar que vio a la mascota era su propia dueña, justo al revés de para qué
-- existe la función.
--
-- Se resuelve con una función SECURITY DEFINER que hace exactamente una cosa:
-- agregar un avistamiento al arreglo. Así el UPDATE general de lost_pet sigue
-- cerrado y no hace falta abrirlo para todo el mundo.
--
-- pg_catalog se busca siempre de forma implícita, así que con search_path = ''
-- las funciones y operadores propios de PostgreSQL siguen resolviéndose; solo
-- hay que calificar los esquemas public y auth.

CREATE OR REPLACE FUNCTION public.agregar_avistamiento(
  id_mascota UUID,
  direccion TEXT,
  nota TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  avistamientos JSONB;
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

  SELECT COALESCE(lp.sightings, '[]'::jsonb)
    INTO avistamientos
    FROM public.lost_pet lp
   WHERE lp.id = id_mascota
     FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No encontramos esa publicación.' USING ERRCODE = 'no_data_found';
  END IF;

  -- Tope defensivo: la función es invocable sin sesión, así que sin límite el
  -- arreglo podría crecer sin control.
  IF jsonb_array_length(avistamientos) >= 50 THEN
    RAISE EXCEPTION 'Esta publicación ya alcanzó el máximo de avistamientos.' USING ERRCODE = 'check_violation';
  END IF;

  avistamientos := avistamientos || jsonb_build_object(
    'address',     direccion,
    'note',        NULLIF(nota, ''),
    'date',        to_char(now() AT TIME ZONE 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
    'reported_by', (SELECT auth.uid())
  );

  UPDATE public.lost_pet SET sightings = avistamientos WHERE id = id_mascota;

  RETURN avistamientos;
END;
$$;

-- Se otorga también a anon: las mascotas perdidas son una página pública y el
-- sentido de la función es que cualquiera pueda avisar.
GRANT EXECUTE ON FUNCTION public.agregar_avistamiento(UUID, TEXT, TEXT) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5. Código de seguimiento de denuncias
-- ---------------------------------------------------------------------------
-- Se generaba en el navegador con Math.random() y 6 caracteres, sin restricción
-- de unicidad. Como la búsqueda por código devuelve el primer resultado, dos
-- denuncias con el mismo código hacían que una quedara inaccesible y la otra
-- expuesta a quien no le corresponde.

CREATE OR REPLACE FUNCTION public.generar_codigo_seguimiento()
RETURNS TEXT
LANGUAGE sql
VOLATILE
SET search_path = ''
AS $$
  SELECT upper(substr(md5(gen_random_uuid()::text), 1, 8));
$$;

-- Completa las filas que hoy no tienen código, para poder exigir unicidad.
UPDATE public.abuse_report
   SET tracking_code = public.generar_codigo_seguimiento()
 WHERE tracking_code IS NULL OR btrim(tracking_code) = '';

ALTER TABLE public.abuse_report
  ALTER COLUMN tracking_code SET DEFAULT public.generar_codigo_seguimiento();

CREATE UNIQUE INDEX IF NOT EXISTS idx_abuse_report_tracking_code_unico
  ON public.abuse_report (tracking_code);

-- ---------------------------------------------------------------------------
-- 6. El alta de perfil no puede tumbar el registro
-- ---------------------------------------------------------------------------
-- handle_new_user corre dentro de la misma transacción que el INSERT en
-- auth.users. Si el INSERT en profiles falla por cualquier motivo (un perfil ya
-- existente, una restricción nueva), se revierte todo y el registro muere con un
-- "Database error saving new user" que no le dice nada a nadie.
--
-- El perfil se puede recrear después; la cuenta no. Ante la duda, que sobreviva
-- la cuenta y quede el aviso en los registros del servidor.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'No se pudo crear el perfil de % : %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
