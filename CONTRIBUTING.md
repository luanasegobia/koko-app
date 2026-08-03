# Cómo contribuir a Koko App 🐾

Este documento aplica a **todas las personas colaboradoras y a cualquier agente de
inteligencia artificial** que trabaje sobre este repositorio. Leelo antes de hacer
tu primer cambio.

## Regla principal: nunca trabajar directo sobre `main`

`main` es la rama estable: es lo que se despliega y lo que el resto del equipo usa
como base. **No se commitea ni se pushea directo a `main`.**

Todo cambio —por chico que sea— nace en su propia rama y llega a `main` a través de
un Pull Request.

## Flujo de trabajo

1. **Actualizá `main` antes de empezar:**
   ```bash
   git checkout main
   git pull
   ```

2. **Creá tu rama** a partir de `main`:
   ```bash
   git checkout -b feat/nombre-descriptivo
   ```

3. **Trabajá y commiteá** en esa rama, con commits chicos y con sentido propio.

4. **Verificá antes de pushear** (ver checklist más abajo).

5. **Subí la rama:**
   ```bash
   git push -u origin feat/nombre-descriptivo
   ```

6. **Abrí un Pull Request** hacia `main` y esperá la revisión de al menos una
   persona del equipo antes de mergear.

## Convención de nombres de rama

Usá el prefijo que corresponda al tipo de cambio, seguido de una descripción corta
en minúsculas y separada por guiones:

| Prefijo | Cuándo usarlo | Ejemplo |
|---|---|---|
| `feat/` | Funcionalidad nueva | `feat/donaciones-stripe` |
| `fix/` | Corrección de un error | `fix/login-sin-perfil` |
| `refactor/` | Reorganización sin cambiar comportamiento | `refactor/formularios-zod` |
| `chore/` | Configuración, dependencias, tareas de mantenimiento | `chore/actualizar-vite` |
| `docs/` | Solo documentación | `docs/readme-supabase` |

## Mensajes de commit

- **En español**, igual que el resto del proyecto.
- Primera línea corta (hasta ~72 caracteres), en modo imperativo y con el mismo
  prefijo que la rama: `feat: agregar botón de donación con Stripe`.
- Si el cambio necesita explicación, dejá una línea en blanco y detallá el *por qué*
  en el cuerpo del mensaje.

## Checklist antes de abrir el Pull Request

- [ ] `npm run lint` pasa sin errores.
- [ ] `npm run build` compila correctamente.
- [ ] Probaste el cambio a mano en `npm run dev`.
- [ ] No subiste archivos con credenciales: `.env.local` y cualquier `.env*` están
      ignorados por git y **nunca** deben commitearse.
- [ ] Los textos visibles por la persona usuaria están en español.
- [ ] El Pull Request explica qué cambia y por qué.

## Cambios en la base de datos

Los cambios de esquema (tablas, índices, políticas RLS) van versionados como
archivos SQL dentro de `supabase/migrations/`, nunca aplicados solo a mano desde el
panel de Supabase. Así cualquier persona del equipo puede reproducir la base desde
cero.

## Notas para agentes de IA

Además de este documento, las reglas técnicas del proyecto (idioma, Supabase,
Tailwind, estilo de React) están en [`.agents/AGENTS.md`](.agents/AGENTS.md).

Puntualmente:

- Si al empezar una tarea estás parado en `main`, **creá una rama primero**.
- No hagas `push` ni mergees a `main` sin que la persona con la que trabajás lo pida
  explícitamente.
- Reportá siempre en qué rama quedaron los cambios.
