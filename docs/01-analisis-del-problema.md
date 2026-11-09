# Etapa 1 — Análisis del problema

**Proyecto:** Koko App · Conectando Huellas

**Documento:** 1 de 8 · Identificación del problema, usuarios y objetivos

---

## 1. Contexto

En Orán (Salta), como en la mayoría de las ciudades del interior, la vida de las mascotas
y de quienes las cuidan se organiza de manera informal: grupos de WhatsApp y Facebook,
carteles en postes y el boca a boca. Cuando se pierde un animal, la información se
dispersa entre decenas de publicaciones que no se pueden buscar, no tienen ubicación en un
mapa y desaparecen del feed en pocas horas. Quien encuentra un animal sin chapa no tiene
forma de contactar a su familia. Las adopciones dependen de que alguien vea la publicación
correcta en el momento correcto. No existe un directorio confiable que diga qué
veterinaria atiende urgencias o cuál está de turno. Las situaciones de maltrato animal se
comentan pero rara vez se canalizan, y quien denuncia no puede saber qué pasó después.
Los rescatistas y organizaciones que necesitan juntar dinero para una cirugía o un
tratamiento dependen de cadenas de mensajes que se cortan.

## 2. Definición del problema

**La información sobre mascotas perdidas, adopciones, veterinarias, denuncias y casos
urgentes de Orán está fragmentada en canales informales que no permiten buscar, ubicar
geográficamente ni hacer seguimiento.** Esto reduce las chances de reunir a un animal
perdido con su familia, demora adopciones, dificulta encontrar atención veterinaria en
una urgencia y deja sin respuesta a quien denuncia un maltrato o pide ayuda para un caso
crítico.

## 3. Usuarios del sistema

| Usuario | Quién es | Qué necesita del sistema |
|---|---|---|
| **Visitante** | Cualquier persona sin cuenta, por ejemplo quien encuentra un animal en la calle o escanea una chapa con QR. | Ver mascotas perdidas, casos urgentes y veterinarias; avisar que vio una mascota; ver la ficha de una mascota escaneando su QR; consultar el estado de una denuncia con su código. |
| **Usuario registrado** | Vecino o vecina con cuenta: dueño de mascota, persona que quiere adoptar o que quiere colaborar. | Publicar una mascota perdida o en adopción, registrar sus mascotas con ficha QR, hacer denuncias, publicar casos urgentes, chatear sobre una publicación, recibir alertas de su zona. |
| **Rescatista / Organización (ONG)** | Persona u organización que rescata animales y gestiona casos. | Lo mismo que el usuario registrado, con foco en publicar casos urgentes con alias de donación y animales en adopción. |
| **Veterinario / Clínica** | Profesional o establecimiento veterinario. | Figurar en el directorio público con dirección, teléfono, servicios y si atiende urgencias. |
| **Administrador** | Integrante del equipo que modera la plataforma. | Verificar veterinarias antes de que aparezcan en el directorio, cambiar el estado de casos urgentes, mascotas perdidas y denuncias, ver estadísticas globales. |

En el sistema, el tipo de cuenta (usuario, rescatista, organización o veterinario) se
elige al completar el perfil, y el permiso de administración es una marca aparte que solo
se otorga desde la base de datos.

## 4. Objetivos

### Objetivo general

Desarrollar una aplicación web, accesible desde el celular, que centralice en una sola
plataforma comunitaria la gestión de mascotas perdidas, adopciones, veterinarias,
identificación digital, denuncias por maltrato y casos urgentes en la ciudad de Orán.

### Objetivos específicos

1. **Mascotas perdidas.** Permitir publicar una mascota perdida con foto y ubicación,
   verla en un mapa, filtrar por especie, estado y cercanía, y que cualquier persona pueda
   reportar un avistamiento sin necesidad de registrarse.
2. **Adopciones.** Ofrecer un catálogo de animales en adopción con filtros por especie y
   tamaño, datos sanitarios (vacunado, esterilizado) y contacto directo por teléfono o
   chat.
3. **Veterinarias.** Mantener un directorio de veterinarias verificadas por un
   administrador, con mapa, teléfono y distinción de las que atienden urgencias.
4. **Identificación digital.** Generar para cada mascota registrada una ficha pública
   accesible por código QR, con datos de contacto del dueño y alergias, que pueda imprimirse
   en una chapa.
5. **Denuncias por maltrato.** Recibir denuncias (urgentes, regulares o anónimas) con
   ubicación y evidencia, entregar un código de seguimiento y permitir consultar su estado.
6. **Casos urgentes.** Difundir casos que necesitan colaboración, con meta económica,
   alias bancario para donar y lista de necesidades.
7. **Comunidad y alertas.** Habilitar un chat por publicación y notificaciones por zona
   para que las novedades lleguen a quien está cerca.
8. **Seguridad.** Garantizar que cada persona solo pueda modificar sus propias
   publicaciones y que las tareas de moderación queden reservadas a administración.

## 5. Alcance

**Dentro del alcance de esta entrega:**

- Los seis módulos funcionales (perdidas, adopción, veterinarias, identificación QR,
  denuncias, casos urgentes), con altas, ediciones y bajas por su autor.
- Registro e inicio de sesión con email y contraseña, verificación por código y
  recuperación de contraseña.
- Panel de administración para verificar veterinarias y cambiar estados.
- Chat por publicación y suscripción a alertas por zona.
- Base de datos con políticas de seguridad a nivel de fila (RLS) versionadas.

**Fuera del alcance (previsto para versiones posteriores):**

- Donaciones con tarjeta a través de Stripe: la integración existe pero queda
  deshabilitada hasta configurar las credenciales y el webhook de confirmación.
- Chat y notificaciones en tiempo real: los mensajes se cargan al abrir la conversación,
  todavía no llegan solos.
- Inicio de sesión con Google: depende de habilitar el proveedor en Supabase.
- Identificación por NFC (solo QR en esta versión).

## 6. Resultado esperado

Una aplicación web progresiva publicada, con su código en GitHub, que una persona de Orán
pueda abrir desde el celular para publicar una mascota perdida en menos de dos minutos, y
que cualquier vecino que la vea pueda avisar con un toque, sin crear una cuenta.
