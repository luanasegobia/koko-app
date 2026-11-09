# Etapa 2 — Ingeniería de requisitos

**Proyecto:** Koko App · Conectando Huellas

**Documento:** 2 de 8 · Requisitos funcionales, no funcionales y de datos

---

## 1. Convenciones

- **Prioridad.** *Alta*: sin esto el módulo no cumple su objetivo. *Media*: mejora
  sustancial. *Baja*: deseable.
- **Estado.** *Implementado*: funciona en el código actual. *Parcial*: existe pero con
  limitaciones que se indican. *Pendiente*: definido pero no desarrollado.
- **Referencia.** Archivo del repositorio donde se resuelve el requisito, para
  trazabilidad con la Etapa 7.

## 2. Requisitos funcionales

### 2.1 Cuentas y acceso

| ID | Requisito | Actor | Prioridad | Estado | Referencia |
|---|---|---|---|---|---|
| RF-01 | El sistema debe permitir registrarse con nombre completo, email y contraseña (mínimo 6 caracteres, con confirmación) y verificar el email mediante un código de 6 dígitos. | Visitante | Alta | Implementado | `src/pages/Register.jsx` |
| RF-02 | El sistema debe permitir iniciar sesión con email y contraseña, y cerrar sesión. | Usuario registrado | Alta | Implementado | `src/pages/Login.jsx`, `src/components/layout/Sidebar.jsx` |
| RF-03 | El sistema debe permitir recuperar la contraseña mediante un enlace enviado por email, sin revelar si el email existe. | Visitante | Alta | Implementado | `src/pages/ForgotPassword.jsx`, `src/pages/ResetPassword.jsx` |
| RF-04 | Al primer ingreso, el sistema debe obligar a completar el perfil eligiendo un tipo de cuenta (usuario, rescatista, organización o veterinario) y datos de contacto. | Usuario registrado | Alta | Implementado | `src/pages/CompleteProfile.jsx` |
| RF-05 | El sistema debe permitir iniciar sesión con una cuenta de Google. | Visitante | Baja | Parcial (el botón existe; el proveedor no está habilitado en Supabase) | `src/pages/Login.jsx`, README |
| RF-06 | Las pantallas de adopción, identificación, denuncias, inicio y administración deben requerir sesión iniciada y perfil completo; las de perdidas, casos urgentes, veterinarias y ficha QR deben ser públicas. | Todos | Alta | Implementado | `src/App.jsx` |

### 2.2 Mascotas perdidas

| ID | Requisito | Actor | Prioridad | Estado | Referencia |
|---|---|---|---|---|---|
| RF-07 | El sistema debe permitir publicar una mascota perdida con nombre, especie, raza, edad, descripción, foto (tomada con la cámara o elegida), dirección donde se vio por última vez, coordenadas GPS y teléfono/WhatsApp de contacto. | Usuario registrado | Alta | Implementado | `src/components/lost/LostPetForm.jsx`, `src/schemas/index.js` |
| RF-08 | El sistema debe listar las mascotas perdidas con filtros por especie (perro, gato, otro), estado (perdida, encontrada) y cercanía a la ubicación del usuario (radio de 0,5 a 20 km). | Visitante | Alta | Implementado | `src/pages/LostPets.jsx`, `src/components/map/ProximityFilter.jsx` |
| RF-09 | El sistema debe mostrar las mascotas perdidas y sus avistamientos en un mapa, diferenciando perdidas, encontradas y avistamientos. | Visitante | Alta | Implementado | `src/components/map/PetMap.jsx` |
| RF-10 | Cualquier persona, sin necesidad de cuenta, debe poder reportar un avistamiento indicando dónde la vio, una nota y opcionalmente su ubicación GPS. Se admiten hasta 50 avistamientos por publicación. | Visitante | Alta | Implementado | `src/components/lost/SightingDialog.jsx`, RPC `agregar_avistamiento` |
| RF-11 | El autor de una publicación debe poder editarla y eliminarla. | Usuario registrado | Alta | Implementado | `src/components/comun/AccionesDeDuenio.jsx` |
| RF-12 | El autor debe poder marcar su mascota como encontrada. | Usuario registrado | Alta | Parcial (hoy solo el administrador puede cambiar el estado) | `src/components/admin/AdminCases.jsx` |
| RF-13 | El sistema debe permitir buscar publicaciones por texto (nombre, raza o zona) desde la pantalla de inicio. | Usuario registrado | Media | Pendiente (el buscador de inicio no filtra resultados) | `src/pages/Home.jsx` |

### 2.3 Adopciones

| ID | Requisito | Actor | Prioridad | Estado | Referencia |
|---|---|---|---|---|---|
| RF-14 | El sistema debe permitir publicar un animal en adopción con nombre, especie, raza, edad, sexo, tamaño, descripción, foto, si está vacunado y esterilizado, ubicación y contacto. | Usuario registrado | Alta | Implementado | `src/components/adoption/AdoptionForm.jsx` |
| RF-15 | El sistema debe listar los animales en adopción con filtros por especie y tamaño, mostrando estado, sexo y datos sanitarios. | Usuario registrado | Alta | Implementado | `src/pages/Adoption.jsx` |
| RF-16 | El interesado debe poder contactar al publicante por teléfono o mediante un chat asociado a la publicación. | Usuario registrado | Alta | Implementado | `src/components/chat/ChatWindow.jsx` |
| RF-17 | El publicante debe poder cambiar el estado de la adopción (disponible, en proceso, adoptado). | Usuario registrado | Media | Pendiente (el estado existe en la base pero no se puede modificar desde la interfaz) | — |

### 2.4 Veterinarias

| ID | Requisito | Actor | Prioridad | Estado | Referencia |
|---|---|---|---|---|---|
| RF-18 | Al elegir el tipo de cuenta "veterinario", el sistema debe registrar la veterinaria con nombre, dirección, teléfono, servicios y descripción, en estado *pendiente de verificación*. | Veterinario | Alta | Implementado | `src/pages/CompleteProfile.jsx` |
| RF-19 | El directorio público debe mostrar solo veterinarias verificadas, en lista y en mapa, con botón para llamar. | Visitante | Alta | Implementado | `src/pages/Veterinaries.jsx` |
| RF-20 | El sistema debe destacar las veterinarias que atienden urgencias las 24 horas y ordenarlas primero. | Visitante | Alta | Implementado | `src/pages/Veterinaries.jsx` |
| RF-21 | El sistema debe indicar si una veterinaria está de turno según su horario de atención y cuándo abre la próxima vez. | Visitante | Media | Parcial (el cálculo existe; no hay pantalla para cargar los horarios) | `src/pages/Veterinaries.jsx` |
| RF-22 | El administrador debe poder aprobar o revocar la verificación de una veterinaria. | Administrador | Alta | Implementado | `src/components/admin/AdminVets.jsx` |
| RF-23 | El responsable de una veterinaria debe poder editar su ficha; solo el administrador puede eliminarla. | Veterinario, Administrador | Media | Implementado | `src/components/vet/VeterinariaForm.jsx` |

### 2.5 Identificación digital (QR)

| ID | Requisito | Actor | Prioridad | Estado | Referencia |
|---|---|---|---|---|---|
| RF-24 | El sistema debe permitir registrar una mascota propia con nombre, especie, raza, edad, sexo, foto, descripción, alergias y datos de contacto del dueño. | Usuario registrado | Alta | Implementado | `src/components/petid/PetForm.jsx` |
| RF-25 | Al registrar una mascota, el sistema debe generar un código único y un QR descargable en PNG que enlace a su ficha pública. El código no debe cambiar al editar la mascota, para no invalidar chapas ya impresas. | Usuario registrado | Alta | Implementado | `src/components/petid/PetQRCard.jsx` |
| RF-26 | Cualquier persona que escanee el QR debe ver la ficha pública con foto, datos, alergias destacadas y botones para llamar o escribir por WhatsApp al dueño. | Visitante | Alta | Implementado | `src/pages/PetPublicProfile.jsx` |
| RF-27 | El usuario debe ver únicamente sus propias mascotas en la pantalla de identificación. | Usuario registrado | Alta | Implementado | `src/pages/PetID.jsx` |
| RF-28 | Quien encuentra la mascota debe poder avisar al dueño con un botón desde la ficha pública. | Visitante | Media | Pendiente (el botón muestra confirmación pero no envía ninguna notificación) | `src/pages/PetPublicProfile.jsx` |

### 2.6 Denuncias por maltrato

| ID | Requisito | Actor | Prioridad | Estado | Referencia |
|---|---|---|---|---|---|
| RF-29 | El sistema debe permitir realizar una denuncia de tipo urgente, regular o anónima, con descripción, dirección, coordenadas GPS y evidencia (imágenes o videos de hasta 25 MB cada uno). En las anónimas no se registran nombre ni teléfono del denunciante. | Usuario registrado | Alta | Implementado | `src/components/abuse/AbuseReportForm.jsx` |
| RF-30 | Al registrar la denuncia, el sistema debe generar un código de seguimiento único de 8 caracteres y mostrarlo al denunciante. | Usuario registrado | Alta | Implementado | función de base `generar_codigo_seguimiento()` |
| RF-31 | Cualquier persona debe poder consultar el estado de una denuncia ingresando su código de seguimiento. | Visitante | Alta | Implementado | `src/components/abuse/TrackingLookup.jsx` |
| RF-32 | El sistema debe listar las denuncias con filtros por tipo, estado y cercanía, y mostrarlas en un mapa. | Usuario registrado | Media | Implementado | `src/pages/AbuseReports.jsx` |
| RF-33 | El administrador debe poder cambiar el estado de una denuncia (pendiente, en revisión, derivada, resuelta) y ver la evidencia adjunta. | Administrador | Alta | Implementado | `src/components/admin/AdminCases.jsx` |
| RF-34 | El denunciante no debe poder eliminar su denuncia; solo el administrador. | Administrador | Alta | Implementado | `src/pages/AbuseReports.jsx` |
| RF-35 | El sistema debe informar el marco legal (Ley 14.346) y enlazar al canal oficial de denuncias. | Todos | Baja | Implementado | `src/pages/AbuseReports.jsx` |

### 2.7 Casos urgentes y donaciones

| ID | Requisito | Actor | Prioridad | Estado | Referencia |
|---|---|---|---|---|---|
| RF-36 | El sistema debe permitir publicar un caso urgente con título, descripción, foto, quién lo publica, meta económica, alias bancario para donar y lista de necesidades. | Usuario registrado | Alta | Implementado | `src/components/urgent/UrgentCaseForm.jsx` |
| RF-37 | El sistema debe listar los casos urgentes con barra de progreso de recaudación, cantidad de colaboradores y estado de cada necesidad. | Visitante | Alta | Implementado | `src/pages/UrgentCases.jsx` |
| RF-38 | El sistema debe permitir copiar el alias bancario con un toque para donar por transferencia. | Visitante | Alta | Implementado | `src/pages/UrgentCases.jsx` |
| RF-39 | El sistema debe permitir donar con tarjeta mediante Stripe (monto mínimo $100) y registrar el monto recaudado. | Visitante | Media | Parcial (la función de pago existe; queda deshabilitada hasta configurar credenciales y falta el webhook que actualiza lo recaudado) | `src/components/urgent/BotonDonarStripe.jsx`, `supabase/functions/create-checkout-session` |
| RF-40 | El administrador debe poder cambiar el estado del caso (activo, en curso, resuelto). | Administrador | Alta | Implementado | `src/components/admin/AdminCases.jsx` |
| RF-41 | El publicante debe poder marcar cada necesidad como pendiente, parcial o cubierta. | Usuario registrado | Media | Pendiente | — |

### 2.8 Comunidad: chat, notificaciones y alertas

| ID | Requisito | Actor | Prioridad | Estado | Referencia |
|---|---|---|---|---|---|
| RF-42 | Cada publicación de mascota perdida y caso urgente debe tener un chat rápido en el que pueda participar cualquier persona, incluso sin cuenta, identificándose con un nombre. | Visitante | Alta | Implementado | `src/components/chat/QuickChat.jsx` |
| RF-43 | Las publicaciones de adopción deben tener un chat para usuarios registrados, en ventana flotante. | Usuario registrado | Media | Implementado | `src/components/chat/ChatWindow.jsx` |
| RF-44 | El autor de una publicación debe recibir una notificación cuando alguien responde en su chat. | Usuario registrado | Alta | Implementado | trigger de base `notificar_respuesta_chat()` |
| RF-45 | El usuario debe poder suscribirse a alertas de su zona indicando ubicación, radio (1 a 30 km) y si quiere avisos de mascotas perdidas y/o casos urgentes. | Usuario registrado | Media | Implementado | `src/components/notifications/AlertSettingsPanel.jsx` |
| RF-46 | El sistema debe generar notificaciones cuando se publique una mascota perdida dentro del radio del usuario o se actualice un caso urgente. | Sistema | Media | Parcial (implementado como sondeo cada 30 s, desactivado hasta validarlo) | `src/lib/useNotifications.js` |
| RF-47 | El usuario debe poder ver sus notificaciones, marcarlas como leídas y ver cuántas tiene sin leer. | Usuario registrado | Media | Implementado | `src/components/notifications/NotificationPanel.jsx` |
| RF-48 | Los mensajes de chat y las notificaciones deben llegar en tiempo real sin recargar la página. | Usuario registrado | Baja | Pendiente (desactivado por bandera de entorno) | `src/api/supabaseClient.js` |

### 2.9 Administración

| ID | Requisito | Actor | Prioridad | Estado | Referencia |
|---|---|---|---|---|---|
| RF-49 | El panel de administración debe ser accesible solo para cuentas con la marca de administrador, y mostrar estadísticas globales (perdidas y encontradas, adopciones, casos por estado, denuncias por estado, veterinarias verificadas y pendientes). | Administrador | Alta | Implementado | `src/pages/AdminDashboard.jsx`, `src/components/admin/AdminStats.jsx` |
| RF-50 | El administrador debe poder editar y eliminar cualquier publicación de cualquier módulo. | Administrador | Alta | Implementado | políticas RLS + `AccionesDeDuenio.jsx` |
| RF-51 | La marca de administrador solo debe poder otorgarse desde la base de datos, nunca desde la aplicación. | Administrador | Alta | Implementado | migración `20260803234227_separar_tipo_cuenta_y_admin.sql` |

## 3. Requisitos no funcionales

| ID | Categoría | Requisito | Estado | Referencia |
|---|---|---|---|---|
| RNF-01 | Seguridad | Toda tabla debe tener seguridad a nivel de fila (RLS): lectura pública donde corresponde, escritura solo por el autor del registro o un administrador. Los permisos de la interfaz son una comodidad; la autoridad es la base de datos. | Implementado | `supabase/migrations/` |
| RNF-02 | Seguridad | La autoría de cada registro la asigna el servidor (valor por defecto igual al usuario autenticado); el cliente no puede publicar a nombre de otra persona. | Implementado | migración `20260812045503_autoria_y_marcas_de_tiempo.sql` |
| RNF-03 | Seguridad | La aplicación solo puede usar la clave pública (*anon*) de Supabase y debe rechazar activamente una clave de servicio pegada por error. | Implementado | `src/api/entorno.js` |
| RNF-04 | Seguridad | La función de pago con tarjeta debe exigir sesión válida (JWT) para no poder invocarse anónimamente con cualquier monto. | Implementado | `supabase/config.toml` |
| RNF-05 | Privacidad | El código QR debe generarse en el propio dispositivo, sin enviar la URL de la mascota a servicios de terceros. | Implementado | `src/components/petid/PetQRCard.jsx` |
| RNF-06 | Privacidad | La recuperación de contraseña debe responder igual exista o no la cuenta, para no permitir enumerar usuarios. | Implementado | `src/pages/ForgotPassword.jsx` |
| RNF-07 | Privacidad | Cada usuario debe ver únicamente sus propias mascotas registradas y sus propias notificaciones y suscripciones. | Parcial (las notificaciones y suscripciones lo garantiza RLS; las mascotas solo el filtro de la interfaz, la lectura de la tabla sigue siendo pública) | `src/pages/PetID.jsx` |
| RNF-08 | Usabilidad | La interfaz debe estar íntegramente en español rioplatense y diseñada primero para celular (*mobile first*), con barra de navegación inferior en pantallas chicas. | Implementado | `src/components/layout/` |
| RNF-09 | Usabilidad | Debe ofrecer modo claro y oscuro, respetando la preferencia del sistema operativo. | Implementado | `src/lib/ThemeContext.jsx` |
| RNF-10 | Usabilidad | Los formularios deben validar los datos antes de enviarlos y mostrar mensajes de error claros en español, incluidos los errores de red y de permisos. | Implementado | `src/schemas/index.js`, `src/lib/mensajeDeError.js` |
| RNF-11 | Usabilidad | Las acciones que requieren cámara o GPS deben funcionar sin ellos: si el permiso se niega, la persona puede escribir la dirección o elegir una foto a mano. | Implementado | `src/components/comun/BotonUbicacion.jsx` |
| RNF-12 | Rendimiento | Las pantallas deben responder en menos de 2 segundos en una conexión móvil. Las listas se limitan (50 mascotas propias, 100 mensajes por chat) y las consultas usan índices por estado, especie, fecha y autor. | Implementado | índices en `supabase/migrations/` |
| RNF-13 | Rendimiento | Los datos consultados deben cachearse en el cliente y actualizarse solo tras una modificación, para no repetir consultas al volver a una pantalla. | Implementado | `src/lib/query-client.js` (TanStack Query) |
| RNF-14 | Disponibilidad | El backend debe estar alojado en la nube (Supabase) sin requerir servidores propios ni instalación local para el equipo. | Implementado | README |
| RNF-15 | Portabilidad | La aplicación debe funcionar en navegadores modernos (Chrome, Edge, Firefox, Safari) e instalarse como PWA con ícono propio en el celular. | Implementado | `public/manifest`, `index.html` |
| RNF-16 | Robustez | Un error de configuración (faltan claves) debe mostrar una pantalla con los pasos para resolverlo, no una página en blanco. Un error inesperado no debe tumbar toda la aplicación. | Implementado | `src/components/ErrorBoundary.jsx` |
| RNF-17 | Robustez | Las funciones accesorias (campana de notificaciones, chat) no deben impedir usar la pantalla que las contiene si fallan. | Implementado | `src/lib/useNotifications.js` |
| RNF-18 | Mantenibilidad | El esquema de base de datos debe estar versionado en migraciones, una por cambio, nunca editando una existente. | Implementado | `supabase/migrations/` |
| RNF-19 | Mantenibilidad | El código debe pasar el linter, los tests automatizados y la compilación antes de integrarse; todo cambio entra por rama y Pull Request revisado. | Implementado | `CONTRIBUTING.md`, `package.json` |
| RNF-20 | Mantenibilidad | Comentarios, nombres de rama, commits y documentación en español. | Implementado | `CONTRIBUTING.md` |
| RNF-21 | Legal | El módulo de denuncias debe informar el marco legal vigente (Ley 14.346 de protección animal) y remitir al canal oficial. | Implementado | `src/pages/AbuseReports.jsx` |

## 4. Requisitos de datos

Resumen de la información que el sistema debe almacenar. El diseño detallado (tipos,
claves y relaciones) se desarrolla en la Etapa 6.

| ID | Entidad | Información que guarda | Tabla |
|---|---|---|---|
| RD-01 | **Perfil de usuario** | Email, nombre completo, teléfono, avatar, tipo de cuenta (usuario, rescatista, organización, veterinario), marca de administrador, perfil completo, biografía, zona, nombre de la organización. | `profiles` |
| RD-02 | **Mascota identificada** | Nombre, especie, raza, edad, sexo, foto, descripción, alergias, nombre/teléfono/WhatsApp del dueño, código QR único, autor. | `pet` |
| RD-03 | **Mascota perdida** | Nombre, especie, raza, edad, foto, descripción, dirección y coordenadas de última vez vista, teléfono/WhatsApp, estado (perdida, encontrada), lista de avistamientos (dirección, nota, coordenadas, fecha, quién reportó), autor. | `lost_pet` |
| RD-04 | **Animal en adopción** | Nombre, especie, raza, edad, sexo, tamaño, foto, descripción, vacunado, esterilizado, contacto, ubicación, estado (disponible, en proceso, adoptado), autor. | `adoption_pet` |
| RD-05 | **Veterinaria** | Nombre, dirección, teléfono, coordenadas, atiende urgencias, horarios por día, servicios, descripción, verificada, quién la registró. | `veterinary` |
| RD-06 | **Caso urgente** | Título, descripción, foto, quién publica, meta, monto recaudado, cantidad de colaboradores, alias de donación, necesidades (etiqueta y estado), estado (activo, en curso, resuelto), autor. | `urgent_case` |
| RD-07 | **Denuncia** | Tipo (urgente, regular, anónima), descripción, dirección, coordenadas, evidencia (lista de archivos), nombre y teléfono del denunciante, código de seguimiento único, estado (pendiente, en revisión, derivada, resuelta), autor. | `abuse_report` |
| RD-08 | **Mensaje de chat** | Conversación (tipo y publicación a la que pertenece), título de contexto, emisor (usuario o invitado) y su nombre, texto, quiénes lo leyeron, fecha. | `chat_message` |
| RD-09 | **Notificación** | Usuario destinatario, tipo, título, cuerpo, referencia y enlace a la publicación, leída, distancia en km, fecha. | `app_notification` |
| RD-10 | **Suscripción a alertas** | Usuario, email, coordenadas, radio en km, etiqueta de la ubicación, avisar mascotas perdidas, avisar casos urgentes. | `alert_subscription` |
| RD-11 | **Archivos** | Fotos de mascotas y evidencia de denuncias, en un bucket público organizado por usuario. | Storage `public-files` |

Todas las entidades registran fecha de creación y de última modificación.

## 5. Reglas de negocio

| ID | Regla |
|---|---|
| RN-01 | Una veterinaria no aparece en el directorio público hasta que un administrador la verifica. No es posible registrarla ya verificada. |
| RN-02 | Una denuncia anónima no guarda nombre ni teléfono del denunciante, pero requiere sesión iniciada para evitar publicaciones huérfanas y abuso. |
| RN-03 | El código de seguimiento de una denuncia y el código QR de una mascota se generan una sola vez y no cambian al editar el registro. |
| RN-04 | Los avistamientos pueden cargarse sin cuenta, pero cada publicación admite como máximo 50 y cada avistamiento debe indicar dónde se vio (hasta 200 caracteres). |
| RN-05 | Los datos del perfil que definen permisos (tipo de cuenta, administrador) se leen siempre de la tabla de perfiles, nunca de los metadatos editables por el usuario. |
| RN-06 | El chat de una publicación es una conversación grupal única por publicación; no hay mensajería privada. |
| RN-07 | El monto mínimo de una donación con tarjeta es de $100 (pesos argentinos). |
