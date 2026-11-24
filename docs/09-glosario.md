# Glosario

**Proyecto:** Koko App · Conectando Huellas

**Documento:** 9 de 9 · Términos, siglas y abreviaturas usados en la documentación

---

Los términos están en orden alfabético. Entre paréntesis se indica el documento donde
se desarrollan con más detalle.

## Términos del dominio

| Término | Definición |
|---|---|
| **Adopción** | Publicación de un animal que busca hogar, con datos sanitarios (vacunado, esterilizado) y contacto. Estados: *disponible*, *en proceso*, *adoptado* (Etapa 2, RF-14 a RF-17). |
| **Alerta por zona** | Suscripción de un usuario para recibir avisos de mascotas perdidas o casos urgentes dentro de un radio (1 a 30 km) alrededor de un punto que elige (Etapa 2, RF-45). |
| **Alias de donación** | Alias bancario o de billetera virtual que el autor de un caso urgente publica para recibir transferencias. |
| **Avistamiento** | Aviso de que alguien vio una mascota publicada como perdida: dónde, una nota opcional y, si se comparte, la ubicación GPS. Se puede cargar sin cuenta (Etapa 3, CU-07). |
| **Caso urgente** | Publicación de un animal que necesita ayuda económica o de insumos (cirugía, tratamiento, tránsito), con meta de recaudación y lista de necesidades (Etapa 2, RF-36 a RF-41). |
| **Chapita / chapa QR** | Placa que se cuelga del collar con el código QR de la mascota impreso; al escanearla se abre su ficha pública. |
| **Chat rápido** | Conversación grupal asociada a una publicación (mascota perdida o caso urgente) en la que cualquiera puede participar, incluso sin cuenta. |
| **Código de seguimiento** | Código único de 8 caracteres que recibe quien hace una denuncia para consultar después su estado (Etapa 6, `generar_codigo_seguimiento`). |
| **Consejo de temporada** | Recomendación de cuidado que el inicio muestra según el mes del año (calor, lluvias, pirotecnia, vacunación). |
| **Denuncia** | Reporte de una situación de maltrato animal, de tipo *urgente*, *regular* o *anónima*, con evidencia y código de seguimiento. Estados: *pendiente*, *en revisión*, *derivada*, *resuelta*. |
| **Denuncia anónima** | Denuncia que no guarda nombre ni teléfono del denunciante, aunque requiere sesión para evitar abusos (RN-02). |
| **Ficha pública** | Página que se abre al escanear el QR de una mascota: foto, datos, alergias destacadas y contacto del dueño. No requiere cuenta. |
| **ID Digital / Identificación digital** | Módulo donde cada usuario registra sus mascotas y obtiene el código QR de cada una. |
| **Ley 14.346** | Ley nacional argentina de protección animal que tipifica el maltrato y la crueldad hacia los animales como delito. |
| **Mascota perdida** | Publicación de un animal extraviado con foto, último lugar donde se lo vio y contacto. Estados: *perdida*, *encontrada*. |
| **Necesidad** | Cada ítem que pide un caso urgente (por ejemplo "Cirugía de cadera"), con estado *pendiente*, *parcial* o *cubierto*. |
| **Panel de administración** | Pantalla reservada a administradores para ver estadísticas, verificar veterinarias y cambiar estados de casos, mascotas y denuncias. |
| **Rescatista** | Persona que rescata animales de la calle y gestiona su atención y adopción. Es uno de los tipos de cuenta. |
| **Tipo de cuenta** | Perfil que elige cada persona al registrarse: usuario común, rescatista, organización o veterinario. Es informativo; no otorga permisos. |
| **Veterinaria verificada** | Veterinaria que un administrador revisó y aprobó; recién entonces aparece en el directorio público (RN-01). |
| **Veterinaria de turno** | Veterinaria que, según su horario cargado, está abierta en el momento de la consulta. |

## Términos técnicos

| Término | Definición |
|---|---|
| **Angular** | Framework de Google para construir aplicaciones web de una sola página con TypeScript. Koko usa la versión 21 con componentes *standalone* y *signals*. |
| **API REST** | Interfaz que expone los datos por HTTP con operaciones estándar (leer, crear, modificar, borrar). Supabase la genera automáticamente a partir de las tablas. |
| **Backend** | Parte del sistema que corre en el servidor: base de datos, autenticación y archivos. En Koko lo provee Supabase. |
| **Bucket** | Contenedor de archivos en el almacenamiento de Supabase. Koko usa uno, `public-files`, para fotos y evidencia. |
| **Capacitor** | Herramienta de Ionic que empaqueta una aplicación web como app nativa para Android (o iOS). |
| **Carga perezosa** (*lazy loading*) | Técnica por la que cada pantalla se descarga recién cuando se la necesita, para que la app abra más rápido. |
| **Clave anónima** (*anon key*) | Clave pública de Supabase que usa la aplicación desde el navegador. No da privilegios: todo lo que permite lo deciden las políticas RLS. |
| **Clave de servicio** (*service_role*) | Clave de Supabase que saltea todas las políticas de seguridad. Nunca debe estar en el código de la app; Koko la rechaza si se la configura por error. |
| **Componente standalone** | Componente de Angular que declara sus propias dependencias sin necesidad de módulos. |
| **Edge Function** | Función que corre en los servidores de Supabase. Koko tiene una, `create-checkout-session`, que inicia el pago con Stripe. |
| **Frontend** | Parte del sistema que ve y usa la persona: las pantallas. En Koko está hecha con Ionic y Angular. |
| **Geolocalización / GPS** | Obtención de la ubicación del dispositivo (latitud y longitud) para mostrar publicaciones en el mapa o filtrar por cercanía. |
| **Guardia** (*guard*) | Función de Angular que decide si se puede entrar a una pantalla (por ejemplo, exigir sesión o perfil completo). |
| **Ionic** | Biblioteca de componentes visuales con aspecto de app nativa para web y celulares. Koko usa la versión 9. |
| **JSONB** | Tipo de dato de PostgreSQL que guarda estructuras JSON (listas, objetos) dentro de una columna. Koko lo usa para avistamientos, necesidades y horarios. |
| **JWT** (*JSON Web Token*) | Credencial firmada que identifica la sesión del usuario en cada pedido a Supabase. |
| **Leaflet** | Biblioteca de mapas interactivos usada con los mapas de OpenStreetMap. |
| **Migración** | Archivo SQL que aplica un cambio al esquema de la base de datos. Se guardan en orden en `supabase/migrations/` y nunca se editan una vez aplicadas. |
| **Modo oscuro** | Variante de colores de la interfaz con fondo oscuro; la app respeta la preferencia del sistema y recuerda la elección. |
| **OpenStreetMap** | Mapa del mundo libre y colaborativo que provee las imágenes de los mapas. |
| **OTP** (*One-Time Password*) | Código de un solo uso (6 dígitos) que llega por email para verificar la cuenta al registrarse. |
| **Política RLS** | Regla escrita en la base de datos que indica quién puede leer, crear, modificar o borrar cada fila de una tabla. |
| **PostgreSQL** | Sistema de base de datos relacional de código abierto que usa Supabase. |
| **Pull Request** (PR) | Pedido para integrar los cambios de una rama a la rama principal, que otro integrante revisa antes de aprobar. |
| **PWA** (*Progressive Web App*) | Aplicación web que puede agregarse a la pantalla de inicio del celular con su propio ícono. |
| **Reactive Forms** | Forma de construir formularios en Angular donde los campos y sus validaciones se definen en el código. |
| **Realtime** | Servicio de Supabase que envía al instante los cambios de la base a la app (mensajes de chat y notificaciones). |
| **RPC** (*Remote Procedure Call*) | Llamada desde la app a una función de la base de datos, por ejemplo `agregar_avistamiento` o `ficha_publica_mascota`. |
| **SECURITY DEFINER** | Modo de una función de PostgreSQL que se ejecuta con los permisos de quien la creó. Permite hacer una tarea puntual que la persona no podría hacer directamente, con validaciones propias. |
| **Signal** | Valor reactivo de Angular: cuando cambia, la pantalla que lo usa se actualiza sola. |
| **SPA** (*Single Page Application*) | Aplicación que carga una sola página y cambia de pantalla sin recargar el navegador. |
| **Storage** | Servicio de almacenamiento de archivos de Supabase. |
| **Stripe** | Plataforma de pagos con tarjeta usada (de forma opcional) para donar a casos urgentes. |
| **Supabase** | Plataforma en la nube que ofrece base de datos PostgreSQL, autenticación, almacenamiento de archivos, tiempo real y funciones. Es todo el backend de Koko. |
| **Trigger** | Función de la base de datos que se ejecuta sola ante un evento (por ejemplo, al insertar un mensaje se notifica al dueño de la publicación). |
| **UUID** | Identificador único de 128 bits que se usa como clave primaria de cada registro. |
| **Vitest** | Herramienta con la que se escriben y ejecutan los tests automatizados del proyecto. |
| **Webhook** | Aviso automático que un servicio externo (por ejemplo Stripe) envía a otro sistema cuando ocurre algo, como un pago confirmado. |

## Términos de la metodología

| Término | Definición |
|---|---|
| **Actor** | Persona o sistema externo que interactúa con el sistema en un caso de uso (Etapa 3). |
| **Caso de uso** | Descripción de una interacción completa entre un actor y el sistema para lograr un objetivo, con su flujo principal y alternativos. |
| **Diagrama de clases** | Diagrama UML que muestra las entidades del dominio, sus atributos y relaciones. |
| **Diagrama de secuencia** | Diagrama UML que muestra los mensajes que se intercambian los participantes de un proceso, en orden temporal. |
| **Diagrama entidad-relación (DER)** | Diagrama que representa las tablas de la base de datos y cómo se relacionan (Etapa 6). |
| **Fase** | Cada uno de los cuatro tramos de RUP: Inicio, Elaboración, Construcción y Transición (Etapa 5). |
| **Hito** | Punto de control al final de una fase, con un entregable concreto. |
| **Iteración** | Ciclo corto dentro de una fase en el que se hace un poco de cada disciplina y se obtiene algo que funciona. |
| **Regla de negocio** | Condición que el sistema siempre debe respetar, independiente de la pantalla (por ejemplo, RN-01). |
| **Requisito funcional** | Lo que el sistema debe hacer (por ejemplo, publicar una mascota perdida). |
| **Requisito no funcional** | Cómo debe hacerlo: seguridad, rendimiento, usabilidad, portabilidad, etc. |
| **RUP** (*Rational Unified Process*) | Proceso de desarrollo iterativo e incremental organizado en fases e iteraciones. |
| **Trazabilidad** | Posibilidad de seguir un requisito hasta los casos de uso, diagramas y archivos de código que lo resuelven. |
| **UML** (*Unified Modeling Language*) | Lenguaje gráfico estándar para modelar sistemas de software. |

## Siglas usadas en la documentación

| Sigla | Significado |
|---|---|
| **CU-xx** | Caso de uso número xx (Etapa 3). |
| **RD-xx** | Requisito de datos número xx (Etapa 2). |
| **RF-xx** | Requisito funcional número xx (Etapa 2). |
| **RN-xx** | Regla de negocio número xx (Etapa 2). |
| **RNF-xx** | Requisito no funcional número xx (Etapa 2). |
| **R-x** | Riesgo número x (Etapa 5). |
| **PK / FK / UK** | Clave primaria, clave foránea y clave única (Etapa 6). |
| **RLS** | *Row Level Security*: seguridad a nivel de fila de PostgreSQL. |
