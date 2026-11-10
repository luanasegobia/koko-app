-- Cierra los huecos que quedaban abiertos con la clave anónima, que es pública
-- por diseño (viaja dentro del bundle del navegador):
--
--   1. Las denuncias de maltrato se podían leer completas, con nombre, teléfono
--      y autor, incluso las "anónimas".
--   2. Quien registraba una veterinaria podía marcarla como verificada.
--   3. Quien publicaba un caso urgente podía inventar lo recaudado.
--   4. En el chat cualquiera podía escribir con el id y el nombre de otra
--      persona, y elegir el título de la notificación que le llegaba al dueño.
--   5. Se podían listar los teléfonos de todas las personas con mascotas.
--   6. Cualquier persona con sesión podía subir archivos a la carpeta de otra.
--
-- La interfaz ya respetaba casi todo esto; lo que faltaba era que la base lo
-- exigiera, porque a la base se le puede hablar sin pasar por la interfaz.

-- ---------------------------------------------------------------------------
-- 1. Denuncias: la fila completa solo la ven su autor y administración
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "abuse_report_select_all" ON public.abuse_report;
DROP POLICY IF EXISTS "abuse_report_select_autor_admin" ON public.abuse_report;
CREATE POLICY "abuse_report_select_autor_admin" ON public.abuse_report
  FOR SELECT USING (created_by_id = (SELECT auth.uid()) OR public.es_administrador());

-- El listado y el mapa de /denuncias siguen siendo visibles para la comunidad,
-- pero solo con lo que sirve para ubicar el caso. Quedan afuera el nombre y el
-- teléfono de quien denuncia, la evidencia, el autor y el código de
-- seguimiento, que funciona como contraseña de la denuncia.
--
-- SECURITY DEFINER porque tiene que leer filas que la política de arriba ya no
-- deja ver; por eso mismo devuelve una lista cerrada de columnas y no la fila.
CREATE OR REPLACE FUNCTION public.denuncias_publicas()
RETURNS TABLE (
  id UUID,
  type TEXT,
  description TEXT,
  address TEXT,
  lat NUMERIC,
  lng NUMERIC,
  status TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT d.id, d.type, d.description, d.address, d.lat, d.lng, d.status, d.created_at
    FROM public.abuse_report d
   ORDER BY d.created_at DESC
   LIMIT 100;
$$;

-- Seguimiento por código: antes era un filtro del navegador sobre una tabla que
-- se podía leer entera. Ahora el código es lo único que abre la denuncia.
CREATE OR REPLACE FUNCTION public.consultar_denuncia(codigo TEXT)
RETURNS TABLE (
  tracking_code TEXT,
  type TEXT,
  status TEXT,
  description TEXT,
  address TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT d.tracking_code, d.type, d.status, d.description, d.address, d.created_at, d.updated_at
    FROM public.abuse_report d
   WHERE d.tracking_code = upper(btrim(codigo));
$$;

-- /denuncias vive detrás del login, así que ninguna de las dos se otorga a
-- anon. Supabase le da EXECUTE a anon por defecto sobre toda función nueva, por
-- eso el REVOKE lo nombra además de PUBLIC.
REVOKE EXECUTE ON FUNCTION public.denuncias_publicas() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.consultar_denuncia(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.denuncias_publicas() TO authenticated;
GRANT EXECUTE ON FUNCTION public.consultar_denuncia(TEXT) TO authenticated;

-- Quien denuncia no puede reescribir la denuncia ni cambiarle el estado después
-- de enviarla. La interfaz nunca ofreció esa edición; la política sí la dejaba.
DROP POLICY IF EXISTS "abuse_report_update_owner_admin" ON public.abuse_report;
DROP POLICY IF EXISTS "abuse_report_update_admin" ON public.abuse_report;
CREATE POLICY "abuse_report_update_admin" ON public.abuse_report
  FOR UPDATE USING (public.es_administrador());

-- ---------------------------------------------------------------------------
-- 2. Veterinarias: la verificación la decide administración
-- ---------------------------------------------------------------------------
-- El alta ya nacía sin verificar, pero la política de UPDATE dejaba que la
-- propia veterinaria se cambiara is_verified. Se resuelve con un trigger y no
-- con permisos por columna para no tener que mantener la lista de columnas
-- editables cada vez que la tabla cambie.
--
-- Sin SECURITY DEFINER: dentro de una función definer, current_user es quien
-- posee la función y no quien ejecuta la consulta.
CREATE OR REPLACE FUNCTION public.proteger_verificacion_veterinaria()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.is_verified IS DISTINCT FROM OLD.is_verified
     AND current_user NOT IN ('postgres', 'supabase_admin', 'service_role')
     AND NOT public.es_administrador()
  THEN
    RAISE EXCEPTION 'Solo administración puede verificar una veterinaria.'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.proteger_verificacion_veterinaria() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_veterinary_verificacion ON public.veterinary;
CREATE TRIGGER on_veterinary_verificacion
  BEFORE UPDATE ON public.veterinary
  FOR EACH ROW EXECUTE FUNCTION public.proteger_verificacion_veterinaria();

-- ---------------------------------------------------------------------------
-- 3. Casos urgentes: lo recaudado no lo escribe quien publica
-- ---------------------------------------------------------------------------
-- raised_amount y contributors_count son la cuenta de donaciones. El formulario
-- los manda en cero al crear y no los toca al editar, pero por la API se podían
-- poner en cualquier valor. Los puede cambiar administración y, cuando exista
-- el webhook de pagos, el rol de servicio.
CREATE OR REPLACE FUNCTION public.proteger_recaudacion_caso()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF current_user IN ('postgres', 'supabase_admin', 'service_role')
     OR public.es_administrador()
  THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.raised_amount := 0;
    NEW.contributors_count := 0;
  ELSIF NEW.raised_amount IS DISTINCT FROM OLD.raised_amount
     OR NEW.contributors_count IS DISTINCT FROM OLD.contributors_count
  THEN
    RAISE EXCEPTION 'El monto recaudado no se puede modificar a mano.'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.proteger_recaudacion_caso() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_urgent_case_recaudacion ON public.urgent_case;
CREATE TRIGGER on_urgent_case_recaudacion
  BEFORE INSERT OR UPDATE ON public.urgent_case
  FOR EACH ROW EXECUTE FUNCTION public.proteger_recaudacion_caso();

-- ---------------------------------------------------------------------------
-- 4. Chat: la identidad de quien escribe la pone el servidor
-- ---------------------------------------------------------------------------
-- El chat rápido sigue admitiendo invitados sin sesión, que es como alguien que
-- encontró una mascota avisa sin registrarse. Lo que cambia es que sender_id y
-- sender_name dejan de ser lo que diga el navegador:
--
--   * con sesión, son el id y el nombre del perfil de quien escribe;
--   * sin sesión, el id siempre empieza con guest_ (nunca puede ser el uuid de
--     una cuenta) y el nombre queda marcado como "(invitado)".
--
-- Acá sí conviene un trigger que pise lo que mande el cliente, a diferencia de
-- created_by_id: el cliente no tiene ningún motivo legítimo para elegir estos
-- valores.
CREATE OR REPLACE FUNCTION public.sellar_remitente_chat()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  uid UUID := (SELECT auth.uid());
  nombre TEXT;
  recientes INTEGER;
BEGIN
  NEW.text := btrim(COALESCE(NEW.text, ''));
  IF NEW.text = '' THEN
    RAISE EXCEPTION 'El mensaje no puede estar vacío.' USING ERRCODE = 'check_violation';
  END IF;
  IF length(NEW.text) > 1000 THEN
    RAISE EXCEPTION 'El mensaje no puede superar los 1000 caracteres.' USING ERRCODE = 'check_violation';
  END IF;
  IF length(NEW.conversation_id) > 200 THEN
    RAISE EXCEPTION 'La conversación no es válida.' USING ERRCODE = 'check_violation';
  END IF;
  NEW.context_title := left(NEW.context_title, 120);

  IF current_user IN ('postgres', 'supabase_admin', 'service_role') THEN
    RETURN NEW;
  END IF;

  IF uid IS NOT NULL THEN
    SELECT NULLIF(btrim(p.full_name), '') INTO nombre
      FROM public.profiles p
     WHERE p.id = uid;

    NEW.sender_id := uid::text;
    NEW.sender_name := COALESCE(nombre, 'Usuario');
    NEW.read_by := jsonb_build_array(uid::text);
  ELSE
    IF NEW.sender_id IS NULL OR NEW.sender_id NOT LIKE 'guest\_%' THEN
      NEW.sender_id := 'guest_' || gen_random_uuid()::text;
    END IF;
    NEW.sender_id := left(NEW.sender_id, 120);

    nombre := NULLIF(btrim(COALESCE(NEW.sender_name, '')), '');
    NEW.sender_name := COALESCE(left(nombre, 40), 'Anónimo') || ' (invitado)';
    NEW.read_by := '[]'::jsonb;

    -- Cada mensaje dispara una notificación al dueño de la publicación. Sin un
    -- freno, un script sin sesión podía llenarle la bandeja.
    SELECT count(*) INTO recientes
      FROM public.chat_message m
     WHERE m.conversation_id = NEW.conversation_id
       AND m.sender_id LIKE 'guest\_%'
       AND m.created_at > now() - interval '1 minute';

    IF recientes >= 10 THEN
      RAISE EXCEPTION 'Hay demasiados mensajes seguidos en esta conversación. Probá de nuevo en un minuto.'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.sellar_remitente_chat() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_chat_message_sellar ON public.chat_message;
CREATE TRIGGER on_chat_message_sellar
  BEFORE INSERT ON public.chat_message
  FOR EACH ROW EXECUTE FUNCTION public.sellar_remitente_chat();

-- La notificación al dueño usaba context_title tal como lo mandaba el cliente,
-- así que quien escribía elegía el título de una notificación ajena. Ahora el
-- título sale de la publicación real. El cuerpo sigue siendo el mensaje, con el
-- nombre que acaba de sellar el trigger de arriba.
CREATE OR REPLACE FUNCTION public.notificar_respuesta_chat()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  duenio UUID;
  titulo TEXT;
  enlace TEXT;
BEGIN
  IF NEW.context_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.context_type = 'lost_pet' THEN
    SELECT created_by_id, pet_name INTO duenio, titulo FROM public.lost_pet WHERE id::text = NEW.context_id;
    enlace := '/perdidas';
  ELSIF NEW.context_type = 'urgent_case' THEN
    SELECT created_by_id, title INTO duenio, titulo FROM public.urgent_case WHERE id::text = NEW.context_id;
    enlace := '/casos-urgentes';
  ELSIF NEW.context_type = 'adoption' THEN
    SELECT created_by_id, name INTO duenio, titulo FROM public.adoption_pet WHERE id::text = NEW.context_id;
    enlace := '/adopcion';
  ELSE
    RETURN NEW;
  END IF;

  -- Sin dueño identificado, o el mensaje es del propio dueño: no se notifica.
  IF duenio IS NULL OR duenio::text = NEW.sender_id THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.app_notification (user_id, type, title, body, ref_id, link, read)
  VALUES (
    duenio,
    'chat_reply',
    '💬 Nueva respuesta en "' || COALESCE(left(titulo, 80), 'tu publicación') || '"',
    COALESCE(NEW.sender_name, 'Alguien') || ': ' || left(NEW.text, 80),
    NEW.context_id,
    enlace,
    false
  );

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.notificar_respuesta_chat() FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5. Mascotas: la ficha pública se abre con el código del QR, no listando
-- ---------------------------------------------------------------------------
-- pet guarda el nombre, el teléfono y el WhatsApp de cada persona dueña. Con
-- lectura pública bastaba un select para llevárselos todos. La ficha del QR
-- solo necesita una mascota por vez, y solo si se conoce su código.
DROP POLICY IF EXISTS "pet_select_all" ON public.pet;
DROP POLICY IF EXISTS "pet_select_owner_admin" ON public.pet;
CREATE POLICY "pet_select_owner_admin" ON public.pet
  FOR SELECT USING (created_by_id = (SELECT auth.uid()) OR public.es_administrador());

CREATE OR REPLACE FUNCTION public.ficha_publica_mascota(codigo TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  species TEXT,
  breed TEXT,
  age_years NUMERIC,
  sex TEXT,
  photo_url TEXT,
  description TEXT,
  allergies TEXT,
  owner_name TEXT,
  owner_phone TEXT,
  owner_whatsapp TEXT,
  qr_id TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT p.id, p.name, p.species, p.breed, p.age_years, p.sex, p.photo_url,
         p.description, p.allergies, p.owner_name, p.owner_phone, p.owner_whatsapp, p.qr_id
    FROM public.pet p
   WHERE codigo IS NOT NULL
     AND btrim(codigo) <> ''
     AND p.qr_id = btrim(codigo);
$$;

-- Se otorga también a anon: quien escanea la chapita de una mascota perdida no
-- tiene cuenta, y ese es justamente el caso de uso.
REVOKE EXECUTE ON FUNCTION public.ficha_publica_mascota(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ficha_publica_mascota(TEXT) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- 6. Storage: cada quien sube a su carpeta, y con límites del lado del servidor
-- ---------------------------------------------------------------------------
-- subirArchivo ya guarda todo en <id de usuario>/<archivo>, pero la política
-- aceptaba cualquier ruta. La de UPDATE no miraba de quién era el archivo.
DROP POLICY IF EXISTS "storage_insert_auth" ON storage.objects;
DROP POLICY IF EXISTS "storage_insert_carpeta_propia" ON storage.objects;
CREATE POLICY "storage_insert_carpeta_propia" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'public-files'
    AND (SELECT auth.uid()) IS NOT NULL
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

DROP POLICY IF EXISTS "storage_update_auth" ON storage.objects;
DROP POLICY IF EXISTS "storage_update_owner" ON storage.objects;
CREATE POLICY "storage_update_owner" ON storage.objects
  FOR UPDATE USING (bucket_id = 'public-files' AND owner = (SELECT auth.uid()));

-- El tamaño y el tipo solo se validaban en el navegador. 25 MB es el máximo que
-- usa la app (la evidencia en video de las denuncias).
UPDATE storage.buckets
   SET file_size_limit = 26214400,
       allowed_mime_types = ARRAY['image/*', 'video/*']
 WHERE id = 'public-files';
