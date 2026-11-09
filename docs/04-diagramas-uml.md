# Etapa 4 — Diagramas UML

**Proyecto:** Koko App · Conectando Huellas

**Documento:** 4 de 8 · Diagramas de clases, de secuencia, de flujo y de estados

---

## 1. Convenciones

- Los diagramas están escritos en Mermaid dentro de este documento y se renderizan al
  generar el PDF. El texto fuente es la versión oficial: si cambia el código, se corrige
  acá y se vuelve a exportar.
- Las clases del dominio llevan nombre en español (`MascotaPerdida`) y, entre paréntesis
  en el diccionario, la tabla de PostgreSQL que las persiste (`lost_pet`). Los atributos
  conservan el nombre de columna para que el diagrama sirva como referencia directa de la
  Etapa 6.
- Cada diagrama indica los casos de uso (CU-xx) y requisitos (RF-xx) que ilustra.

## 2. Diagrama de componentes: arquitectura general

Antes de las clases conviene ver cómo se reparte el sistema. Koko es una aplicación de
una sola página (SPA) en React que habla con Supabase; no hay servidor propio. La lógica
que necesita privilegios vive en la base de datos como funciones y triggers.

```mermaid
flowchart TB
  subgraph Cliente["Navegador / PWA (React + Vite)"]
    direction TB
    Paginas["Páginas<br/>(LostPets, Adoption, PetID, AbuseReports, UrgentCases, Veterinaries, AdminDashboard…)"]
    Componentes["Componentes por módulo<br/>(formularios, tarjetas, mapa, chat, notificaciones)"]
    Esquemas["Validación<br/>src/schemas (Zod)"]
    Contextos["Contextos<br/>AuthContext · NotificationsContext · ThemeContext"]
    Capa["Capa de datos<br/>src/api/supabaseClient.js<br/>(db.entities · db.rpc · db.storage · db.auth)"]
    Paginas --> Componentes --> Esquemas
    Componentes --> Capa
    Contextos --> Capa
  end

  subgraph Supabase["Supabase (nube)"]
    direction TB
    Auth["Auth<br/>(email + OTP, recuperación, OAuth)"]
    API["PostgREST<br/>(API REST automática)"]
    BD[("PostgreSQL<br/>10 tablas + RLS<br/>funciones y triggers")]
    Storage["Storage<br/>bucket public-files"]
    Edge["Edge Function<br/>create-checkout-session"]
    API --> BD
  end

  Stripe[["Stripe (pagos)"]]
  OSM[["OpenStreetMap<br/>(mapas Leaflet)"]]

  Capa -->|"JWT"| Auth
  Capa -->|"REST + RLS"| API
  Capa -->|"subida de fotos"| Storage
  Capa -.->|"solo si está habilitado"| Edge --> Stripe
  Componentes -.-> OSM
```

**Lectura.** La interfaz nunca accede a la base de datos con privilegios: usa la clave
pública y cada consulta pasa por las políticas de seguridad a nivel de fila (RLS). Lo que
requiere permisos especiales (crear notificaciones para otra persona, agregar
avistamientos a una publicación ajena, generar códigos únicos) se resuelve con funciones
`SECURITY DEFINER` y triggers dentro de PostgreSQL.

## 3. Diagramas de clases

Modelo de dominio: qué objetos maneja el sistema, con sus atributos y relaciones. Se
presenta en tres vistas para que cada una sea legible.

### 3.1 Perfil y mascotas

```mermaid
classDiagram
  direction LR

  class Perfil {
    +UUID id
    +String email
    +String full_name
    +String phone
    +String avatar_url
    +TipoCuenta tipo_cuenta
    +Boolean es_admin
    +Boolean profile_completed
    +String bio
    +String location
    +String organization_name
    +completarPerfil()
    +esAdministrador() Boolean
  }

  class MascotaIdentificada {
    +UUID id
    +String name
    +Especie species
    +String breed
    +Number age_years
    +Sexo sex
    +String photo_url
    +String description
    +String allergies
    +String owner_name
    +String owner_phone
    +String owner_whatsapp
    +String qr_id
    +generarQR() PNG
    +urlFichaPublica() String
  }

  class MascotaPerdida {
    +UUID id
    +String pet_name
    +Especie species
    +String breed
    +Number age_years
    +String photo_url
    +String description
    +String last_seen_address
    +Number last_seen_lat
    +Number last_seen_lng
    +String contact_phone
    +String contact_whatsapp
    +EstadoPerdida status
    +agregarAvistamiento(Avistamiento)
    +distanciaA(lat, lng) km
  }

  class Avistamiento {
    +String address
    +String note
    +Number lat
    +Number lng
    +DateTime date
    +UUID reported_by
  }

  class AnimalAdopcion {
    +UUID id
    +String name
    +Especie species
    +String breed
    +Number age_years
    +Sexo sex
    +Tamanio size
    +String photo_url
    +String description
    +Boolean vaccinated
    +Boolean sterilized
    +String contact_name
    +String contact_phone
    +String location
    +EstadoAdopcion status
  }

  Perfil "1" --> "0..*" MascotaIdentificada : registra
  Perfil "1" --> "0..*" MascotaPerdida : publica
  Perfil "1" --> "0..*" AnimalAdopcion : publica
  MascotaPerdida "1" *-- "0..50" Avistamiento : sightings
  Perfil "0..1" <.. Avistamiento : reported_by
```

### 3.2 Veterinarias, casos urgentes y denuncias

```mermaid
classDiagram
  direction LR

  class Perfil {
    +UUID id
    +String full_name
    +Boolean es_admin
  }

  class Veterinaria {
    +UUID id
    +String name
    +String address
    +String phone
    +Number lat
    +Number lng
    +Boolean is_emergency
    +String services
    +String bio
    +Boolean is_verified
    +estadoActual() Abierta|Cerrada|Emergencia
    +proximaApertura() DateTime
  }

  class HorarioAtencion {
    +String day
    +String open
    +String close
  }

  class CasoUrgente {
    +UUID id
    +String title
    +String description
    +String photo_url
    +String published_by
    +Number goal_amount
    +Number raised_amount
    +Integer contributors_count
    +String donation_alias
    +EstadoCaso status
    +porcentajeAlcanzado() Number
  }

  class Necesidad {
    +String label
    +EstadoNecesidad status
  }

  class Denuncia {
    +UUID id
    +TipoDenuncia type
    +String description
    +String address
    +Number lat
    +Number lng
    +String[] evidence_urls
    +String reporter_name
    +String reporter_phone
    +String tracking_code
    +EstadoDenuncia status
  }

  Perfil "1" --> "0..1" Veterinaria : registra
  Perfil "1" --> "0..*" CasoUrgente : publica
  Perfil "1" --> "0..*" Denuncia : realiza
  Veterinaria "1" *-- "0..7" HorarioAtencion : schedule
  CasoUrgente "1" *-- "0..*" Necesidad : needs
  Perfil ..> Veterinaria : verifica (admin)
  Perfil ..> Denuncia : modera (admin)
```

### 3.3 Comunidad: chat, notificaciones y alertas

```mermaid
classDiagram
  direction LR

  class Perfil {
    +UUID id
    +String full_name
  }

  class Publicacion {
    <<abstract>>
    +UUID id
    +UUID created_by_id
  }

  class MensajeChat {
    +UUID id
    +String conversation_id
    +ContextoChat context_type
    +String context_id
    +String context_title
    +String sender_id
    +String sender_name
    +String text
    +String[] read_by
    +DateTime created_at
  }

  class Notificacion {
    +UUID id
    +TipoNotificacion type
    +String title
    +String body
    +String ref_id
    +String link
    +Boolean read
    +Number distance_km
    +DateTime created_at
    +marcarLeida()
  }

  class SuscripcionAlertas {
    +UUID id
    +String user_email
    +Number lat
    +Number lng
    +Number radius_km
    +String location_label
    +Boolean notify_lost_pets
    +Boolean notify_urgent_cases
    +estaDentroDelRadio(lat, lng) Boolean
  }

  Publicacion <|-- MascotaPerdida
  Publicacion <|-- CasoUrgente
  Publicacion <|-- AnimalAdopcion
  Publicacion "1" o-- "0..*" MensajeChat : conversación
  Perfil "0..1" --> "0..*" MensajeChat : envía (o invitado)
  Perfil "1" --> "0..*" Notificacion : recibe
  Perfil "1" --> "0..1" SuscripcionAlertas : configura
  MensajeChat ..> Notificacion : genera (trigger)
```

### 3.4 Enumeraciones

Los atributos de tipo enumerado que aparecen en los diagramas toman estos valores
(coinciden con las restricciones `CHECK` de la base de datos).

| Enumeración | Valores | Usada en |
|---|---|---|
| Especie | perro, gato, otro | MascotaIdentificada, MascotaPerdida, AnimalAdopcion |
| Sexo | macho, hembra | MascotaIdentificada, AnimalAdopcion |
| Tamanio | pequeño, mediano, grande | AnimalAdopcion |
| TipoCuenta | usuario, rescatista, organizacion, veterinario | Perfil |
| EstadoPerdida | perdida, encontrada | MascotaPerdida |
| EstadoAdopcion | disponible, en_proceso, adoptado | AnimalAdopcion |
| EstadoCaso | activo, en_curso, resuelto | CasoUrgente |
| EstadoNecesidad | pendiente, parcial, cubierto | Necesidad |
| TipoDenuncia | urgente, regular, anonima | Denuncia |
| EstadoDenuncia | pendiente, en_revision, derivada, resuelta | Denuncia |
| ContextoChat | lost_pet, urgent_case, adoption | MensajeChat |
| TipoNotificacion | lost_pet, urgent_case, sighting, abuse_report, chat_reply, case_update | Notificacion |

**Notas de diseño.**

- `Avistamiento`, `HorarioAtencion` y `Necesidad` no son tablas propias: se guardan como
  arreglos JSON dentro de su publicación (composición fuerte, rombo negro). La Etapa 6
  justifica la decisión.
- `Publicacion` es una abstracción del modelo: en la base no existe una tabla común, pero
  las tres tablas comparten `created_by_id`, `created_at`, `updated_at` y el mismo
  esquema de permisos, y el chat las trata de forma uniforme.
- El emisor de un mensaje puede ser un perfil o un invitado sin cuenta; por eso
  `sender_id` es texto y no una clave foránea.

## 4. Diagramas de secuencia

### 4.1 Publicar mascota perdida (CU-05, RF-07)

```mermaid
sequenceDiagram
  autonumber
  actor U as Usuario registrado
  participant F as LostPetForm
  participant Z as Esquema Zod
  participant S as Storage (public-files)
  participant API as PostgREST + RLS
  participant BD as PostgreSQL

  U->>F: Presiona "Reportar mascota perdida"
  F-->>U: Muestra formulario
  U->>F: Completa datos, saca foto, "Usar mi ubicación"
  F->>F: navigator.geolocation.getCurrentPosition()
  U->>F: "Publicar"
  F->>Z: mascotaPerdidaSchema.parse(datos)
  alt Datos inválidos
    Z-->>F: Errores por campo
    F-->>U: "El nombre es obligatorio"
  else Datos válidos
    opt Hay foto
      F->>S: subirArchivo(foto) → <uid>/<id>.jpg
      S-->>F: file_url
    end
    F->>API: INSERT lost_pet {…, status: "perdida"}
    API->>BD: Evalúa política lost_pet_insert_propio
    BD->>BD: created_by_id = DEFAULT auth.uid()
    BD-->>API: Fila creada
    API-->>F: Registro
    F-->>U: Cierra diálogo, invalida caché ["lostPets"]
  end
```

### 4.2 Reportar avistamiento sin cuenta (CU-07, RF-10)

```mermaid
sequenceDiagram
  autonumber
  actor V as Visitante
  participant C as LostPetCard
  participant D as SightingDialog
  participant API as PostgREST (RPC)
  participant FN as agregar_avistamiento()<br/>SECURITY DEFINER
  participant BD as lost_pet

  V->>C: "La vi"
  C->>D: Abre diálogo (id_mascota)
  V->>D: Dónde la vio, nota, ubicación
  V->>D: "Enviar"
  D->>API: rpc("agregar_avistamiento", {id_mascota, direccion, nota, lat, lng})
  API->>FN: Ejecuta con clave anónima
  FN->>FN: Valida largo, coordenadas completas y en rango
  FN->>BD: SELECT sightings … FOR UPDATE
  alt Publicación inexistente
    FN-->>API: "No encontramos esa publicación"
    API-->>D: Error
    D-->>V: Mensaje en el diálogo
  else Ya hay 50 avistamientos
    FN-->>API: "Máximo de avistamientos"
    API-->>D: Error
  else OK
    FN->>BD: UPDATE sightings = sightings || {address, note, lat, lng, date, reported_by}
    FN-->>API: Arreglo actualizado
    API-->>D: Arreglo actualizado
    D-->>V: "¡Gracias por tu avistamiento!"
    D->>C: Invalida ["lostPets"] → nuevo marcador en el mapa
  end
```

**Por qué una función y no un UPDATE.** La política de `lost_pet` solo deja actualizar al
dueño o a un administrador. Una función `SECURITY DEFINER` hace exactamente una cosa
(agregar un avistamiento) con validaciones propias, sin abrir la tabla entera.

### 4.3 Realizar denuncia con código de seguimiento (CU-16, RF-29, RF-30)

```mermaid
sequenceDiagram
  autonumber
  actor U as Usuario registrado
  participant F as AbuseReportForm
  participant S as Storage
  participant API as PostgREST + RLS
  participant BD as abuse_report

  U->>F: Elige tipo, describe, ubica, adjunta evidencia
  U->>F: "Enviar denuncia"
  F->>F: denunciaSchema.parse(datos)
  loop Por cada archivo de evidencia
    F->>S: subirArchivo(archivo, {image/video, 25 MB})
    S-->>F: file_url
  end
  opt Tipo "anónima"
    F->>F: reporter_name = reporter_phone = undefined
  end
  F->>API: INSERT abuse_report {…, evidence_urls, status: "pendiente"}
  API->>BD: Política abuse_report_insert_propio (exige sesión)
  BD->>BD: tracking_code = DEFAULT generar_codigo_seguimiento()
  BD->>BD: Índice único sobre tracking_code
  BD-->>API: Fila con tracking_code
  API-->>F: Registro
  F-->>U: Pantalla de éxito con el código y botón "Copiar"
```

### 4.4 Mensaje de chat y notificación al dueño (CU-22, RF-44)

```mermaid
sequenceDiagram
  autonumber
  actor V as Visitante o usuario
  participant Q as QuickChat
  participant API as PostgREST
  participant CM as chat_message
  participant T as Trigger<br/>notificar_respuesta_chat()
  participant N as app_notification
  actor D as Dueño de la publicación

  V->>Q: Escribe y presiona Enter
  opt Invitado sin nombre
    Q-->>V: "¿Cómo querés que te identifiquen?"
    V->>Q: Nombre (o "Anónimo")
  end
  Q->>API: INSERT chat_message {conversation_id, context_type, context_id, sender_id, text}
  API->>CM: Inserta (política abierta: admite invitados)
  CM->>T: AFTER INSERT
  T->>T: Busca created_by_id de la publicación según context_type
  alt Sin dueño o el mensaje es del propio dueño
    T-->>CM: No notifica
  else Otro emisor
    T->>N: INSERT {user_id: dueño, type: "chat_reply", title, body, link}
  end
  CM-->>API: Mensaje creado
  API-->>Q: Mensaje (se agrega de forma optimista)
  D->>N: Abre la campana (SELECT propias, RLS)
  N-->>D: "💬 Nueva respuesta en «…»"
```

## 5. Diagramas de flujo

### 5.1 Acceso a una pantalla (RF-06, RF-49)

Cómo decide el enrutador qué mostrar. Es el flujo que atraviesa toda la aplicación.

```mermaid
flowchart TD
  A(["Persona abre una URL"]) --> B{"¿Cargó la sesión?"}
  B -- No --> B1["Muestra spinner"] --> B
  B -- Sí --> C{"¿La ruta es pública?<br/>perdidas, casos urgentes,<br/>veterinarias, ficha QR, login"}
  C -- Sí --> P(["Muestra la pantalla"])
  C -- No --> D{"¿Hay sesión iniciada?"}
  D -- No --> E(["Redirige a iniciar sesión"])
  D -- Sí --> F{"¿Perfil completo?"}
  F -- No --> G(["Redirige a completar perfil<br/>y recuerda a dónde volver"])
  F -- Sí --> H{"¿La ruta es el panel admin?"}
  H -- No --> P
  H -- Sí --> I{"¿es_admin?"}
  I -- Sí --> J(["Panel de administración"])
  I -- No --> K(["Pantalla «Acceso restringido»"])
```

### 5.2 Verificación de una veterinaria (CU-11, CU-13, RN-01)

```mermaid
flowchart TD
  A(["Persona se registra"]) --> B["Completa perfil:<br/>elige tipo de cuenta"]
  B --> C{"¿Eligió<br/>«Veterinario / Clínica»?"}
  C -- No --> C1(["Perfil general listo"])
  C -- Sí --> D["Carga nombre, dirección,<br/>teléfono, servicios, bio"]
  D --> E{"¿Datos válidos?<br/>(esquema Zod)"}
  E -- No --> D
  E -- Sí --> F[("INSERT veterinary<br/>is_verified = false")]
  F --> G{"¿Intentó insertar<br/>is_verified = true?"}
  G -- Sí --> G1(["La base lo rechaza"])
  G -- No --> H["Ficha en estado<br/>Pendiente de verificación"]
  H --> I["Administrador revisa en<br/>Panel Admin, pestaña Veterinarias"]
  I --> J{"¿Corresponde?"}
  J -- Aprobar --> K[("UPDATE is_verified = true")]
  K --> L(["Aparece en el directorio<br/>y en el mapa"])
  J -- "No aprobar" --> H
  L -. Revocar .-> H
```

### 5.3 Búsqueda de mascotas perdidas con filtro de cercanía (CU-06, RF-08)

```mermaid
flowchart TD
  A(["Abre Mascotas perdidas"]) --> B[("SELECT lost_pet<br/>orden: más recientes")]
  B --> C["Aplica filtro de especie"]
  C --> D["Aplica filtro de estado<br/>(inicial: perdida)"]
  D --> E{"¿Activó<br/>«Usar mi ubicación»?"}
  E -- No --> H
  E -- Sí --> F{"¿Permiso de GPS?"}
  F -- Denegado --> F1["Mensaje: podés escribir<br/>la dirección a mano"] --> H
  F -- Concedido --> G["Calcula distancia Haversine<br/>a cada publicación"]
  G --> G1{"¿distancia ≤ radio?"}
  G1 -- No --> G2["Descarta"]
  G1 -- Sí --> H["Lista resultante"]
  H --> I{"¿Vista?"}
  I -- Lista --> J(["Tarjetas con Llamar,<br/>La vi y Chat rápido"])
  I -- Mapa --> K{"¿Tiene coordenadas?"}
  K -- Sí --> L(["Marcador rojo o verde<br/>más avistamientos en ámbar"])
  K -- No --> M(["No se dibuja en el mapa"])
```

## 6. Diagramas de estados

Ciclo de vida de las publicaciones. Las transiciones indican quién las ejecuta.

### 6.1 Denuncia y caso urgente

```mermaid
stateDiagram-v2
  direction LR
  state Denuncia {
    [*] --> pendiente : usuario denuncia
    pendiente --> en_revision : admin
    en_revision --> derivada : admin (autoridades)
    en_revision --> resuelta : admin
    derivada --> resuelta : admin
    pendiente --> [*] : admin elimina
  }
  state CasoUrgente {
    [*] --> activo : usuario publica
    activo --> en_curso : admin
    en_curso --> resuelto : admin
    activo --> resuelto : admin
    activo --> [*] : dueño o admin elimina
  }
```

### 6.2 Mascota perdida, adopción y veterinaria

```mermaid
stateDiagram-v2
  direction LR
  state MascotaPerdida {
    [*] --> perdida : usuario publica
    perdida --> perdida : avistamiento (cualquiera)
    perdida --> encontrada : admin (RF-12 pendiente para el dueño)
    encontrada --> [*] : dueño o admin elimina
  }
  state AnimalAdopcion {
    [*] --> disponible : usuario publica
    disponible --> en_proceso : (RF-17 pendiente)
    en_proceso --> adoptado : (RF-17 pendiente)
    disponible --> [*] : dueño o admin elimina
  }
  state Veterinaria {
    [*] --> pendiente_verificacion : onboarding veterinario
    pendiente_verificacion --> verificada : admin aprueba
    verificada --> pendiente_verificacion : admin revoca
    verificada --> [*] : admin elimina
  }
```

## 7. Trazabilidad

| Diagrama | Casos de uso | Requisitos |
|---|---|---|
| 2 Componentes | Todos | RNF-01, RNF-03, RNF-14 |
| 3.1 Clases: perfil y mascotas | CU-04, CU-05, CU-07, CU-09, CU-14 | RD-01 a RD-04 |
| 3.2 Clases: veterinarias, casos, denuncias | CU-11, CU-13, CU-16, CU-19 | RD-05 a RD-07 |
| 3.3 Clases: comunidad | CU-22, CU-23, CU-24 | RD-08 a RD-10 |
| 4.1 Secuencia: publicar perdida | CU-05 | RF-07, RNF-02, RNF-10 |
| 4.2 Secuencia: avistamiento | CU-07 | RF-10, RN-04 |
| 4.3 Secuencia: denuncia | CU-16 | RF-29, RF-30, RN-02, RN-03 |
| 4.4 Secuencia: chat y notificación | CU-22, CU-24 | RF-42, RF-44 |
| 5.1 Flujo: acceso | CU-02, CU-04 | RF-06, RF-49 |
| 5.2 Flujo: verificación | CU-11, CU-13 | RF-18, RF-22, RN-01 |
| 5.3 Flujo: búsqueda con cercanía | CU-06 | RF-08, RF-09, RNF-11 |
| 6 Estados | CU-13, CU-18, CU-21 | RF-12, RF-17, RF-33, RF-40 |
