-- Los avistamientos guardaban solo la dirección escrita, sin coordenadas, así
-- que nunca podían aparecer en el mapa: LostPets filtra los marcadores por
-- `s.lat && s.lng` y ese filtro descartaba todos.
--
-- CREATE OR REPLACE no puede cambiar la lista de argumentos: crearía una
-- segunda función sobrecargada y PostgREST no sabría cuál llamar. Hay que
-- eliminarla y volver a crearla, junto con su permiso.

DROP FUNCTION IF EXISTS public.agregar_avistamiento(UUID, TEXT, TEXT);

CREATE FUNCTION public.agregar_avistamiento(
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

  -- Tope defensivo: la función es invocable sin sesión, así que sin límite el
  -- arreglo podría crecer sin control.
  IF jsonb_array_length(avistamientos) >= 50 THEN
    RAISE EXCEPTION 'Esta publicación ya alcanzó el máximo de avistamientos.' USING ERRCODE = 'check_violation';
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

-- Se otorga también a anon: las mascotas perdidas son una página pública y el
-- sentido de la función es que cualquiera pueda avisar.
GRANT EXECUTE ON FUNCTION public.agregar_avistamiento(UUID, TEXT, TEXT, NUMERIC, NUMERIC) TO anon, authenticated;
