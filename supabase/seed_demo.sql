-- Datos de demostración para Koko App.
--
-- Carga cuentas ficticias y publicaciones de ejemplo en Orán (Salta) para el manual
-- de usuario, el video de respaldo y la defensa del proyecto. Se ejecuta en el SQL
-- Editor del panel de Supabase (o con el MCP) como rol postgres: por eso saltea las
-- políticas RLS y puede crear usuarios en auth.users.
--
-- Es re-ejecutable: si las cuentas ya existen no las duplica, y las publicaciones
-- usan ids fijos con ON CONFLICT DO NOTHING.
--
-- Cuentas de demo (contraseña para las tres: KokoDemo2026!)
--   vecina.demo@koko.app   → usuario común "María Gutiérrez"
--   refugio.demo@koko.app  → organización "Refugio Patitas Orán"
--   vet.demo@koko.app      → veterinaria "Dra. Carla Méndez" (su clínica queda pendiente de verificación)
--
-- Las fotos son URLs públicas (dog.ceo, placedog.net y Wikimedia Commons).

DO $$
DECLARE
  clave TEXT := 'KokoDemo2026!';
  vecina  UUID;
  refugio UUID;
  vet     UUID;
  dario   UUID;
BEGIN
  -- ---------------------------------------------------------------------------
  -- 1. Cuentas ficticias en auth.users (+ identidad email) y su perfil
  -- ---------------------------------------------------------------------------
  SELECT id INTO vecina  FROM auth.users WHERE email = 'vecina.demo@koko.app';
  IF vecina IS NULL THEN
    vecina := gen_random_uuid();
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change, email_change_token_new, email_change_token_current,
      phone_change, phone_change_token, reauthentication_token, is_sso_user, is_anonymous)
    VALUES ('00000000-0000-0000-0000-000000000000', vecina, 'authenticated', 'authenticated',
      'vecina.demo@koko.app', extensions.crypt(clave, extensions.gen_salt('bf')), now() - interval '40 days',
      '{"provider":"email","providers":["email"]}', '{"full_name":"María Gutiérrez"}',
      now() - interval '40 days', now() - interval '40 days', '', '', '', '', '', '', '', '', false, false);
    INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), vecina, vecina::text, 'email',
      jsonb_build_object('sub', vecina::text, 'email', 'vecina.demo@koko.app', 'email_verified', true, 'phone_verified', false),
      now() - interval '40 days', now() - interval '40 days', now() - interval '40 days');
  END IF;

  SELECT id INTO refugio FROM auth.users WHERE email = 'refugio.demo@koko.app';
  IF refugio IS NULL THEN
    refugio := gen_random_uuid();
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change, email_change_token_new, email_change_token_current,
      phone_change, phone_change_token, reauthentication_token, is_sso_user, is_anonymous)
    VALUES ('00000000-0000-0000-0000-000000000000', refugio, 'authenticated', 'authenticated',
      'refugio.demo@koko.app', extensions.crypt(clave, extensions.gen_salt('bf')), now() - interval '60 days',
      '{"provider":"email","providers":["email"]}', '{"full_name":"Refugio Patitas Orán"}',
      now() - interval '60 days', now() - interval '60 days', '', '', '', '', '', '', '', '', false, false);
    INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), refugio, refugio::text, 'email',
      jsonb_build_object('sub', refugio::text, 'email', 'refugio.demo@koko.app', 'email_verified', true, 'phone_verified', false),
      now() - interval '60 days', now() - interval '60 days', now() - interval '60 days');
  END IF;

  SELECT id INTO vet FROM auth.users WHERE email = 'vet.demo@koko.app';
  IF vet IS NULL THEN
    vet := gen_random_uuid();
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change, email_change_token_new, email_change_token_current,
      phone_change, phone_change_token, reauthentication_token, is_sso_user, is_anonymous)
    VALUES ('00000000-0000-0000-0000-000000000000', vet, 'authenticated', 'authenticated',
      'vet.demo@koko.app', extensions.crypt(clave, extensions.gen_salt('bf')), now() - interval '3 days',
      '{"provider":"email","providers":["email"]}', '{"full_name":"Dra. Carla Méndez"}',
      now() - interval '3 days', now() - interval '3 days', '', '', '', '', '', '', '', '', false, false);
    INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), vet, vet::text, 'email',
      jsonb_build_object('sub', vet::text, 'email', 'vet.demo@koko.app', 'email_verified', true, 'phone_verified', false),
      now() - interval '3 days', now() - interval '3 days', now() - interval '3 days');
  END IF;

  -- El trigger on_auth_user_created ya creó los perfiles; se completan.
  UPDATE public.profiles SET full_name = 'María Gutiérrez', phone = '3878401122', tipo_cuenta = 'usuario',
    profile_completed = true, location = 'Barrio San Ramón', bio = 'Vecina de Orán, amante de los animales.'
  WHERE id = vecina;
  UPDATE public.profiles SET full_name = 'Refugio Patitas Orán', phone = '3878455600', tipo_cuenta = 'organizacion',
    organization_name = 'Refugio Patitas Orán', profile_completed = true, location = 'Barrio El Progreso',
    bio = 'Rescatamos, curamos y damos en adopción responsable desde 2019.'
  WHERE id = refugio;
  UPDATE public.profiles SET full_name = 'Dra. Carla Méndez', phone = '3878410077', tipo_cuenta = 'veterinario',
    profile_completed = true, location = 'Centro', bio = 'Médica veterinaria, clínica de pequeños animales.'
  WHERE id = vet;

  -- Cuenta real del equipo usada como administradora en la demo.
  SELECT id INTO dario FROM auth.users WHERE email = 'cdario.ramirez.248@gmail.com';
  IF dario IS NULL THEN
    RAISE EXCEPTION 'No existe la cuenta cdario.ramirez.248@gmail.com';
  END IF;
  UPDATE public.profiles SET es_admin = true, profile_completed = true WHERE id = dario;

  -- ---------------------------------------------------------------------------
  -- 2. Mascotas perdidas (dos son de la cuenta admin, para ver Editar/Eliminar y avisos)
  -- ---------------------------------------------------------------------------
  INSERT INTO public.lost_pet (id, pet_name, species, breed, age_years, photo_url, description, last_seen_address,
    last_seen_lat, last_seen_lng, contact_phone, contact_whatsapp, status, sightings, created_by_id, created_at)
  VALUES
  ('11111111-0000-4000-8000-000000000001', 'Toby', 'perro', 'Golden Retriever', 3,
    'https://images.dog.ceo/breeds/retriever-golden/n02099601_100.jpg',
    'Muy manso, tiene collar azul con chapita. Se asustó con los fuegos artificiales y salió corriendo.',
    'Av. San Martín y Belgrano', -23.1352, -64.3265, '3878234018', '5493878234018', 'perdida',
    '[{"address":"Plaza Pizarro, frente a la catedral","note":"Estaba tomando agua de la fuente, se fue hacia el sur","lat":-23.1338,"lng":-64.3241,"date":"2026-09-16T14:20:00Z","reported_by":null},
      {"address":"Alvarado al 600","note":"Lo vi con otro perro marrón","lat":-23.1365,"lng":-64.3248,"date":"2026-09-17T09:05:00Z","reported_by":null}]',
    dario, now() - interval '3 days'),
  ('11111111-0000-4000-8000-000000000002', 'Luna', 'gato', 'Siamés', 2,
    'https://commons.wikimedia.org/wiki/Special:FilePath/Cat03.jpg?width=640',
    'Gata siamesa de ojos celestes, muy tímida. No tiene collar. Responde a su nombre si se la llama despacio.',
    'Barrio 20 de Febrero, manzana 12', -23.1421, -64.3312, '3878234018', '5493878234018', 'perdida',
    '[]', dario, now() - interval '1 day'),
  ('11111111-0000-4000-8000-000000000003', 'Rocky', 'perro', 'Beagle', 5,
    'https://images.dog.ceo/breeds/beagle/n02088364_11136.jpg',
    'Beagle tricolor, orejas largas. Está castrado y tiene una cicatriz chica en la pata delantera derecha.',
    'Plaza Pizarro', -23.1338, -64.3241, '3878401122', '5493878401122', 'perdida',
    '[{"address":"Terminal de ómnibus","note":"Andaba entre los colectivos","lat":-23.1290,"lng":-64.3360,"date":"2026-09-14T18:40:00Z","reported_by":null}]',
    vecina, now() - interval '6 days'),
  ('11111111-0000-4000-8000-000000000004', 'Manchas', 'perro', 'Mestizo', 1,
    'https://images.dog.ceo/breeds/boxer/n02108089_1.jpg',
    'Cachorro blanco con manchas marrones. Apareció gracias a un avistamiento de la app. ¡Gracias a todos!',
    'Barrio San Ramón', -23.1450, -64.3200, '3878401122', NULL, 'encontrada',
    '[{"address":"Cancha del barrio San Ramón","note":"Jugando con los chicos","lat":-23.1448,"lng":-64.3205,"date":"2026-09-02T17:00:00Z","reported_by":null}]',
    vecina, now() - interval '20 days'),
  ('11111111-0000-4000-8000-000000000005', 'Michi', 'gato', 'Común europeo', 4,
    'https://commons.wikimedia.org/wiki/Special:FilePath/Cat_November_2010-1a.jpg?width=640',
    'Gato atigrado gris, grande. Tiene una muesca en la oreja izquierda.',
    'Zona Terminal de ómnibus', -23.1290, -64.3360, '3878455600', '5493878455600', 'perdida',
    '[]', refugio, now() - interval '10 days')
  ON CONFLICT (id) DO NOTHING;

  -- ---------------------------------------------------------------------------
  -- 3. Animales en adopción (publica el refugio)
  -- ---------------------------------------------------------------------------
  INSERT INTO public.adoption_pet (id, name, species, breed, age_years, sex, size, photo_url, description,
    vaccinated, sterilized, contact_name, contact_phone, location, status, created_by_id, created_at)
  VALUES
  ('22222222-0000-4000-8000-000000000001', 'Pipo', 'perro', 'Mestizo', 2, 'macho', 'pequeño',
    'https://images.dog.ceo/breeds/pug/n02110958_12120.jpg',
    'Compañero ideal para departamento. Tranquilo, se lleva bien con gatos y chicos.',
    true, true, 'Refugio Patitas Orán', '3878455600', 'Barrio El Progreso', 'disponible', refugio, now() - interval '12 days'),
  ('22222222-0000-4000-8000-000000000002', 'Nina', 'gato', 'Común europeo', 0.5, 'hembra', 'pequeño',
    'https://commons.wikimedia.org/wiki/Special:FilePath/Six_weeks_old_cat_(aka).jpg?width=640',
    'Gatita de 6 meses, juguetona y muy cariñosa. Desparasitada y con primera vacuna.',
    true, false, 'Refugio Patitas Orán', '3878455600', 'Barrio El Progreso', 'disponible', refugio, now() - interval '8 days'),
  ('22222222-0000-4000-8000-000000000003', 'Thor', 'perro', 'Husky siberiano', 4, 'macho', 'grande',
    'https://images.dog.ceo/breeds/husky/n02110185_1469.jpg',
    'Necesita espacio y una familia activa. Muy noble, sabe caminar con correa.',
    true, true, 'Refugio Patitas Orán', '3878455600', 'Barrio El Progreso', 'disponible', refugio, now() - interval '25 days'),
  ('22222222-0000-4000-8000-000000000004', 'Pelusa', 'gato', 'Persa cruza', 6, 'hembra', 'mediano',
    'https://commons.wikimedia.org/wiki/Special:FilePath/Kittyply_edit1.jpg?width=640',
    'Gata adulta, tranquila, ideal para personas mayores. Esterilizada.',
    true, true, 'María Gutiérrez', '3878401122', 'Barrio San Ramón', 'disponible', vecina, now() - interval '4 days')
  ON CONFLICT (id) DO NOTHING;

  -- ---------------------------------------------------------------------------
  -- 4. Veterinarias (cuatro verificadas y una pendiente, registrada por vet.demo)
  -- ---------------------------------------------------------------------------
  INSERT INTO public.veterinary (id, name, address, phone, lat, lng, is_emergency, schedule, services, bio,
    is_verified, registered_by_user_id, created_at)
  VALUES
  ('33333333-0000-4000-8000-000000000001', 'Veterinaria San Roque', 'Av. San Martín 1250', '3878421100',
    -23.1330, -64.3270, true,
    '[{"day":"lunes","open":"00:00","close":"23:59"},{"day":"martes","open":"00:00","close":"23:59"},{"day":"miércoles","open":"00:00","close":"23:59"},{"day":"jueves","open":"00:00","close":"23:59"},{"day":"viernes","open":"00:00","close":"23:59"},{"day":"sábado","open":"00:00","close":"23:59"},{"day":"domingo","open":"00:00","close":"23:59"}]',
    'Urgencias 24 h, cirugía, internación, rayos X', 'Guardia veterinaria permanente en el centro de Orán.',
    true, dario, now() - interval '50 days'),
  ('33333333-0000-4000-8000-000000000002', 'Clínica Veterinaria Del Norte', 'Alvarado 780', '3878433210',
    -23.1368, -64.3252, false,
    '[{"day":"lunes","open":"08:00","close":"20:00"},{"day":"martes","open":"08:00","close":"20:00"},{"day":"miércoles","open":"08:00","close":"20:00"},{"day":"jueves","open":"08:00","close":"20:00"},{"day":"viernes","open":"08:00","close":"20:00"},{"day":"sábado","open":"09:00","close":"13:00"}]',
    'Consultas, vacunación, laboratorio, peluquería canina', 'Atención de pequeños animales con turno y sin turno.',
    true, dario, now() - interval '48 days'),
  ('33333333-0000-4000-8000-000000000003', 'Veterinaria Patitas', 'Egües 455', '3878447788',
    -23.1395, -64.3290, false,
    '[{"day":"lunes","open":"09:00","close":"19:00"},{"day":"martes","open":"09:00","close":"19:00"},{"day":"miércoles","open":"09:00","close":"19:00"},{"day":"jueves","open":"09:00","close":"19:00"},{"day":"viernes","open":"09:00","close":"19:00"}]',
    'Consultas, castraciones a bajo costo, alimento balanceado', 'Trabajamos con el refugio en campañas de castración.',
    true, refugio, now() - interval '45 days'),
  ('33333333-0000-4000-8000-000000000004', 'Veterinaria Los Pinos', 'Ruta 50 km 3, El Cruce', '3878460011',
    -23.1210, -64.3400, false,
    '[{"day":"lunes","open":"08:00","close":"12:30"},{"day":"martes","open":"08:00","close":"12:30"},{"day":"miércoles","open":"08:00","close":"12:30"},{"day":"jueves","open":"08:00","close":"12:30"},{"day":"viernes","open":"08:00","close":"12:30"},{"day":"sábado","open":"08:00","close":"12:00"}]',
    'Grandes y pequeños animales, atención a domicilio', 'Veterinaria de zona rural con atención a campo.',
    true, dario, now() - interval '30 days'),
  ('33333333-0000-4000-8000-000000000005', 'Consultorio Dra. Méndez', 'Pellegrini 320', '3878410077',
    -23.1345, -64.3298, false,
    '[{"day":"lunes","open":"15:00","close":"20:00"},{"day":"miércoles","open":"15:00","close":"20:00"},{"day":"viernes","open":"15:00","close":"20:00"}]',
    'Clínica general, ecografías, odontología', 'Consultorio nuevo en el centro. Turnos por WhatsApp.',
    false, vet, now() - interval '3 days')
  ON CONFLICT (id) DO NOTHING;

  -- ---------------------------------------------------------------------------
  -- 5. Casos urgentes (publica el refugio)
  -- ---------------------------------------------------------------------------
  INSERT INTO public.urgent_case (id, title, description, photo_url, published_by, goal_amount, raised_amount,
    contributors_count, donation_alias, needs, status, created_by_id, created_at)
  VALUES
  ('44444444-0000-4000-8000-000000000001', 'Cirugía de cadera para Bruno',
    'Bruno fue atropellado en la ruta 50 y tiene fractura de cadera. La veterinaria San Roque lo estabilizó, pero necesita una cirugía que el refugio no puede costear solo.',
    'https://placedog.net/640/480?id=25', 'Refugio Patitas Orán', 180000, 65000, 12, 'patitas.oran.mp',
    '[{"label":"Cirugía de cadera","status":"pendiente"},{"label":"Radiografías","status":"cubierto"},{"label":"Alimento por 2 meses","status":"parcial"},{"label":"Hogar de tránsito","status":"cubierto"}]',
    'activo', refugio, now() - interval '5 days'),
  ('44444444-0000-4000-8000-000000000002', 'Tratamiento de moquillo para camada rescatada',
    'Rescatamos seis cachorros con moquillo en el barrio El Progreso. Ya están en tratamiento y evolucionan bien. ¡Meta alcanzada, gracias!',
    'https://placedog.net/640/480?id=33', 'Refugio Patitas Orán', 90000, 90000, 31, 'patitas.oran.mp',
    '[{"label":"Medicación","status":"cubierto"},{"label":"Suero e internación","status":"cubierto"},{"label":"Alimento cachorro","status":"cubierto"}]',
    'en_curso', refugio, now() - interval '18 days')
  ON CONFLICT (id) DO NOTHING;

  -- ---------------------------------------------------------------------------
  -- 6. Denuncias (el código de seguimiento lo genera la base)
  -- ---------------------------------------------------------------------------
  INSERT INTO public.abuse_report (id, type, description, address, lat, lng, evidence_urls, reporter_name,
    reporter_phone, status, created_by_id, created_at)
  VALUES
  ('55555555-0000-4000-8000-000000000001', 'urgente',
    'Perro encadenado en un patio sin agua ni sombra desde hace varios días. Se lo escucha llorar de noche. Está muy flaco.',
    'Barrio San Ramón, manzana 4, casa con portón verde', -23.1455, -64.3195, '[]',
    'María Gutiérrez', '3878401122', 'en_revision', vecina, now() - interval '4 days'),
  ('55555555-0000-4000-8000-000000000002', 'anonima',
    'Una persona abandona cachorros en la zona del río Blanco los fines de semana. Ya van tres veces este mes.',
    'Camino al río Blanco, cerca del puente', -23.1500, -64.3450, '[]',
    NULL, NULL, 'pendiente', vecina, now() - interval '1 day')
  ON CONFLICT (id) DO NOTHING;

  -- ---------------------------------------------------------------------------
  -- 7. Mascotas identificadas con QR (de la cuenta admin, para la pantalla "Mis mascotas")
  -- ---------------------------------------------------------------------------
  INSERT INTO public.pet (id, name, species, breed, age_years, sex, photo_url, description, allergies,
    owner_name, owner_phone, owner_whatsapp, qr_id, created_by_id, created_at)
  VALUES
  ('66666666-0000-4000-8000-000000000001', 'Kiara', 'perro', 'Border Collie', 4, 'hembra',
    'https://placedog.net/640/480?id=41', 'Muy activa, le encanta la pelota. Si la encontrás, no le des chocolate.',
    'Alérgica a la amoxicilina', 'Darío', '3878234018', '5493878234018', 'k1ar4b0c', dario, now() - interval '30 days'),
  ('66666666-0000-4000-8000-000000000002', 'Simba', 'gato', 'Naranja común', 3, 'macho',
    'https://commons.wikimedia.org/wiki/Special:FilePath/Cat_August_2010-4.jpg?width=640',
    'Gato naranja de interior. Si está en la calle, se perdió.', NULL,
    'Darío', '3878234018', '5493878234018', 's1mb4c4t', dario, now() - interval '15 days')
  ON CONFLICT (id) DO NOTHING;

  -- ---------------------------------------------------------------------------
  -- 8. Chat de la publicación de Toby (el trigger avisa al dueño, la cuenta admin)
  -- ---------------------------------------------------------------------------
  IF NOT EXISTS (SELECT 1 FROM public.chat_message WHERE conversation_id = 'lost_pet_11111111-0000-4000-8000-000000000001') THEN
    INSERT INTO public.chat_message (conversation_id, context_type, context_id, context_title, sender_id, sender_name, text, read_by, created_at)
    VALUES
    ('lost_pet_11111111-0000-4000-8000-000000000001', 'lost_pet', '11111111-0000-4000-8000-000000000001', 'Toby',
      'guest_Pedro_1758030000000', 'Pedro', 'Lo vi ayer a la tarde cerca de la plaza, iba hacia Alvarado.', '[]', now() - interval '2 days'),
    ('lost_pet_11111111-0000-4000-8000-000000000001', 'lost_pet', '11111111-0000-4000-8000-000000000001', 'Toby',
      vecina::text, 'María Gutiérrez', 'Yo también lo vi hoy temprano por Alvarado al 600, estaba con otro perro.', jsonb_build_array(vecina::text), now() - interval '1 day'),
    ('lost_pet_11111111-0000-4000-8000-000000000001', 'lost_pet', '11111111-0000-4000-8000-000000000001', 'Toby',
      dario::text, 'Darío', '¡Gracias! Ya voy para allá.', jsonb_build_array(dario::text), now() - interval '23 hours');
  END IF;

  -- ---------------------------------------------------------------------------
  -- 9. Alertas por zona y una notificación de cercanía para la cuenta admin
  -- ---------------------------------------------------------------------------
  INSERT INTO public.alert_subscription (user_id, user_email, lat, lng, radius_km, location_label, notify_lost_pets, notify_urgent_cases)
  SELECT dario, 'cdario.ramirez.248@gmail.com', -23.1372, -64.3281, 5, 'Casa', true, true
  WHERE NOT EXISTS (SELECT 1 FROM public.alert_subscription WHERE user_id = dario);

  INSERT INTO public.app_notification (user_id, type, title, body, ref_id, link, read, distance_km, created_at)
  SELECT dario, 'lost_pet', '🐾 Mascota perdida cerca (a 1.2 km)', 'Michi (gato) · Zona Terminal de ómnibus',
    '11111111-0000-4000-8000-000000000005', '/perdidas', false, 1.2, now() - interval '10 days'
  WHERE NOT EXISTS (SELECT 1 FROM public.app_notification WHERE user_id = dario AND type = 'lost_pet' AND ref_id = '11111111-0000-4000-8000-000000000005');
END $$;
