-- Endurecimiento de seguridad sobre el esquema inicial.
-- Corrige las advertencias del linter de Supabase:
--   1. handle_new_user con search_path mutable y ejecutable vía RPC.
--   2. Políticas de INSERT sin restricción (app_notification y veterinary).
--   3. El bucket público permitía listar todos los archivos.

-- ---------------------------------------------------------------------------
-- 1. Función de alta de perfil: search_path fijo y sin permisos de ejecución
-- ---------------------------------------------------------------------------
-- Al fijar search_path en '' hay que calificar cada objeto con su esquema, de
-- modo que nadie pueda anteponer un esquema propio y secuestrar la función.
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
  );
  RETURN NEW;
END;
$$;

-- El trigger sigue funcionando: PostgreSQL valida el permiso de ejecución al
-- crear el trigger, no cada vez que se dispara.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2a. Notificaciones: cada quien solo puede crearse las propias
-- ---------------------------------------------------------------------------
-- Antes cualquiera podía insertar notificaciones falsas a cualquier usuario.
-- Las respuestas de chat, que sí deben notificar a otra persona, ahora las
-- genera el trigger de más abajo del lado del servidor.
DROP POLICY IF EXISTS "app_notification_insert_system" ON public.app_notification;
CREATE POLICY "app_notification_insert_own" ON public.app_notification
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.notificar_respuesta_chat()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  duenio UUID;
  enlace TEXT;
BEGIN
  IF NEW.context_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.context_type = 'lost_pet' THEN
    SELECT created_by_id INTO duenio FROM public.lost_pet WHERE id::text = NEW.context_id;
    enlace := '/perdidas';
  ELSIF NEW.context_type = 'urgent_case' THEN
    SELECT created_by_id INTO duenio FROM public.urgent_case WHERE id::text = NEW.context_id;
    enlace := '/casos-urgentes';
  ELSIF NEW.context_type = 'adoption' THEN
    SELECT created_by_id INTO duenio FROM public.adoption_pet WHERE id::text = NEW.context_id;
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
    '💬 Nueva respuesta en "' || COALESCE(NEW.context_title, 'tu publicación') || '"',
    COALESCE(NEW.sender_name, 'Alguien') || ': ' || left(NEW.text, 80),
    NEW.context_id,
    enlace,
    false
  );

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.notificar_respuesta_chat() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_chat_message_created ON public.chat_message;
CREATE TRIGGER on_chat_message_created
  AFTER INSERT ON public.chat_message
  FOR EACH ROW EXECUTE FUNCTION public.notificar_respuesta_chat();

-- ---------------------------------------------------------------------------
-- 2b. Veterinarias: el alta pública no puede autoverificarse
-- ---------------------------------------------------------------------------
-- El alta sigue siendo abierta (la verifica un admin después), pero ya no se
-- puede insertar una veterinaria marcándola como verificada.
DROP POLICY IF EXISTS "veterinary_insert_all" ON public.veterinary;
CREATE POLICY "veterinary_insert_sin_verificar" ON public.veterinary
  FOR INSERT WITH CHECK (is_verified = false);

-- ---------------------------------------------------------------------------
-- 3. Storage: dejar de exponer el listado completo del bucket
-- ---------------------------------------------------------------------------
-- Las URLs públicas siguen funcionando porque el bucket es público; la policy
-- de SELECT solo hace falta para listar, así que se limita al propietario.
DROP POLICY IF EXISTS "storage_select_public" ON storage.objects;
DROP POLICY IF EXISTS "storage_select_owner" ON storage.objects;
CREATE POLICY "storage_select_owner" ON storage.objects
  FOR SELECT USING (bucket_id = 'public-files' AND owner = auth.uid());
