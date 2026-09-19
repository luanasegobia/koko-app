# Etapa 8 — Presentación

**Proyecto:** Koko App · Conectando Huellas

**Documento:** 8 de 8 · Guion de la defensa (16 minutos, 12 diapositivas)

---

Las diapositivas están en `docs/presentacion/Koko-Presentacion.pptx` (se generan con
`node scripts/generar-presentacion.mjs`; las notas del presentador van dentro del archivo).
El manual de usuario es el documento 7. El video de respaldo de la demo está en
`docs/video/koko-demo.mp4`.

## Guion

| # | Diapositiva | Minutos | Qué decir |
|---|---|---|---|
| 1 | Portada | 1 | Presentarse: nombres, materia y qué es Koko en una frase. "Koko es una app comunitaria para las mascotas de Orán: perdidas, adopción, veterinarias, chapa QR, denuncias y casos urgentes en un solo lugar." |
| 2 | El problema | 1 | En Orán todo pasa por grupos de WhatsApp y Facebook: cuando se pierde una mascota la información se dispersa, no se puede buscar ni ubicar en un mapa, y desaparece en horas. Quien encuentra un animal sin chapa no tiene a quién llamar. No hay directorio de veterinarias de turno. Las denuncias no tienen seguimiento. Los rescatistas juntan plata por cadenas de mensajes. |
| 3 | Objetivos | 1 | Objetivo general: una aplicación web, accesible desde el celular, que centralice la gestión de mascotas en Orán. Seis módulos, más comunidad (chat y alertas) y seguridad (cada uno edita solo lo suyo). |
| 4 | Requisitos | 1 | Relevamos 51 requisitos funcionales, 21 no funcionales y 11 de datos. Cada requisito tiene prioridad, estado real (implementado, parcial, pendiente) y el archivo del código que lo resuelve: la documentación describe el sistema tal como está. Destacar los no funcionales de seguridad: RLS en todas las tablas y autoría asignada por el servidor. |
| 5 | Casos de uso | 1 | Seis actores: visitante, usuario registrado, veterinario, administrador, más Supabase y Stripe como sistemas externos. 25 casos de uso; mostramos los dos principales: publicar mascota perdida (CU-05) y reportar avistamiento sin cuenta (CU-07). El visitante puede hacer mucho sin registrarse: es una decisión de diseño para bajar la barrera de entrada. |
| 6 | Diagramas UML | 2 | Clases del dominio (izquierda): Perfil publica MascotaPerdida, AnimalAdopcion y registra MascotaIdentificada; los avistamientos son una composición dentro de la publicación. Secuencia (derecha): "La vi" llama a una función SECURITY DEFINER en la base, porque la política de la tabla solo deja actualizar al dueño; la función valida y agrega el avistamiento. Mencionar que hay 13 diagramas en total: componentes, 3 de clases, 4 de secuencia, 3 de flujo y 2 de estados. |
| 7 | Diseño de base de datos | 1 | PostgreSQL en Supabase, 10 tablas con UUID. Decisiones: listas cortas como JSONB (avistamientos, necesidades, horarios) porque siempre se leen con su publicación y tienen tope; estados como texto con CHECK; seguridad a nivel de fila en todas las tablas, con la autoría asignada por DEFAULT auth.uid(). Siete funciones y triggers hacen lo que necesita privilegios: alta de perfil, avistamientos, código de seguimiento, notificación de chat. |
| 8 | Tecnologías | 1 | Frontend: React 18 con Vite, Tailwind y shadcn/ui, React Router, TanStack Query, react-hook-form con Zod, Leaflet para mapas, qrcode para el QR generado en el dispositivo. Backend: Supabase (PostgreSQL 17, Auth, Storage, Edge Functions). Calidad: ESLint, Vitest, GitHub con ramas y Pull Requests. Sin servidor propio: la app usa la clave pública y la seguridad vive en la base. |
| 9 | Metodología: RUP | 1 | Cuatro fases con fechas reales del repositorio. Inicio en junio: migrar el prototipo de Base44 a Supabase. Elaboración hasta el 3 de agosto: requisitos, esquema, seguridad RLS, tests y flujo de trabajo. Construcción hasta el 21 de agosto: capa de datos, autoría, avistamientos en el mapa, PWA. Transición: documentación, corrección de brechas, pruebas de aceptación, publicación y esta defensa. Ocho semanas efectivas. |
| 10 | Demo en vivo | 4 | Guion de la demo (4 minutos), desde el celular con la cuenta admin y una pestaña sin sesión: 1. Sin sesión: Mascotas perdidas → Mapa → tocar "La vi" en Toby, cargar un avistamiento con ubicación → aparece en el mapa. 2. Con sesión: Reportar mascota perdida con foto de la cámara. 3. ID Digital: ver el QR de Kiara, "Ver ficha" → ficha pública con alergias. 4. Denuncias: Seguir denuncia con el código 3611F2CD. 5. Panel Admin → Veterinarias → Aprobar "Consultorio Dra. Méndez" → aparece en el directorio. 6. Campana: notificaciones de las respuestas del chat. Si falla la conexión: reproducir docs/video/koko-demo.mp4. |
| 11 | Estado del proyecto y mejoras futuras | 1 | Ser honestos con lo que falta: lo documentamos como "parcial" o "pendiente" en la Etapa 2. Lo próximo es habilitar el pago con tarjeta (falta el webhook que actualiza lo recaudado), tiempo real para chat y notificaciones, que el dueño marque su mascota como encontrada, estados de adopción, búsqueda por texto y login con Google. |
| 12 | Conclusiones y aprendizajes | 1 | Qué aprendimos: la seguridad no se puede dejar para el final (la migración desde Base44 dejó la autoría sin asignar y ningún dueño podía editar lo suyo); una base compartida exige disciplina de migraciones; documentar el sistema real, con sus brechas, vale más que prometer. Dificultades: recursión en políticas RLS, sesión y onboarding pisándose, mapas sin coordenadas. Cerrar con la frase de la portada y agradecer. |

## Antes de la defensa

1. Entrar al panel de Supabase y confirmar que el proyecto está activo (los del plan gratuito se pausan por inactividad).
2. Iniciar sesión en el celular con la cuenta administradora y en otra pestaña o celular sin sesión.
3. Verificar que las cuentas de demo existen (`supabase/seed_demo.sql`) y que el código de denuncia 3611F2CD sigue vigente.
4. Tener el video `docs/video/koko-demo.mp4` descargado en la computadora de la presentación.
5. Compartir datos del celular si el aula no tiene conexión.

## Posibles preguntas del tribunal

| Pregunta | Respuesta breve |
|---|---|
| ¿Por qué Supabase y no un backend propio? | Autenticación, base, archivos y API en un solo servicio sin servidor que mantener; la seguridad se resuelve con políticas en la propia base. |
| ¿Cómo evitan que alguien publique a nombre de otro? | La autoría la asigna el servidor con `DEFAULT auth.uid()` y la política de inserción rechaza cualquier otro valor. |
| ¿Por qué los avistamientos no son una tabla? | Se leen siempre con su publicación, tienen tope de 50 y una función controlada los agrega; una tabla aparte sumaba políticas sin beneficio. |
| ¿Qué pasa si el usuario niega el GPS? | Todos los flujos funcionan con la dirección escrita; solo no aparece en el mapa. |
| ¿Qué falta para producción? | Publicar la app con URL propia, habilitar Stripe con su webhook, tiempo real, y las mejoras listadas en la diapositiva 11. |
