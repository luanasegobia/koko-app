-- La ficha pública del QR tiene un botón "Encontré esta mascota" que mostraba
-- "¡Dueño notificado!" sin avisarle a nadie: desde el navegador no se pueden
-- crear notificaciones para otra persona, y quien escanea la chapita ni
-- siquiera tiene cuenta.
--
-- Esta función es la que avisa de verdad. Recibe el código del QR y deja una
-- notificación en la campana de quien registró la mascota.

CREATE OR REPLACE FUNCTION public.avisar_mascota_encontrada(codigo TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  mascota RECORD;
BEGIN
  SELECT p.id, p.name, p.created_by_id
    INTO mascota
    FROM public.pet p
   WHERE codigo IS NOT NULL
     AND btrim(codigo) <> ''
     AND p.qr_id = btrim(codigo);

  -- Sin mascota o sin persona a quien avisar: se devuelve false para que la
  -- pantalla no prometa un aviso que no existió.
  IF NOT FOUND OR mascota.created_by_id IS NULL THEN
    RETURN false;
  END IF;

  -- Quien escanea su propia chapita no necesita avisarse.
  IF mascota.created_by_id = (SELECT auth.uid()) THEN
    RETURN true;
  END IF;

  -- Tope: la función es invocable sin sesión, así que sin esto se podría usar
  -- para llenarle la campana a alguien. Un aviso cada diez minutos por mascota
  -- alcanza; los siguientes se dan por entregados sin crear otro.
  IF EXISTS (
    SELECT 1
      FROM public.app_notification n
     WHERE n.user_id = mascota.created_by_id
       AND n.type = 'sighting'
       AND n.ref_id = mascota.id::text
       AND n.created_at > now() - interval '10 minutes'
  ) THEN
    RETURN true;
  END IF;

  -- Se usa el tipo 'sighting', que ya existe en el CHECK de la tabla. El texto
  -- sale entero de la base: quien llama no elige nada de lo que se muestra.
  INSERT INTO public.app_notification (user_id, type, title, body, ref_id, link, read)
  VALUES (
    mascota.created_by_id,
    'sighting',
    '🐾 Alguien encontró a ' || left(mascota.name, 60),
    'Escanearon la chapita de ' || left(mascota.name, 60)
      || ' y avisaron que la encontraron. Estate atento al teléfono.',
    mascota.id::text,
    '/identificacion',
    false
  );

  RETURN true;
END;
$$;

-- Se otorga también a anon: quien encuentra una mascota y escanea la chapita no
-- tiene cuenta, y ese es justamente el caso de uso.
REVOKE EXECUTE ON FUNCTION public.avisar_mascota_encontrada(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.avisar_mascota_encontrada(TEXT) TO anon, authenticated;
