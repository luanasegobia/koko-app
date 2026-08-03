# Reglas de Agentes para Koko App

Estas reglas de personalización aplican a cualquier agente de inteligencia artificial que asista en el desarrollo de este repositorio.

## 1. Idioma y Nomenclatura (Español Estricto)
- **Código Fuente:** Todas las variables, nombres de funciones, comentarios y documentación interna deben estar escritos en **español**.
- **Interfaz (UI):** Todos los textos visibles por el usuario deben estar en **español**.
- **Commits:** Los mensajes de commit deben redactarse en español.

## 2. Base de Datos y Backend
- **Supabase:** Todo el almacenamiento de datos, autenticación de usuarios (Auth) y almacenamiento de archivos (Storage) debe realizarse obligatoriamente utilizando el cliente oficial de **Supabase**.
- Nunca se deben usar librerías heredadas, configuraciones locales falsas, ni Base44. Todo debe consultar a la API REST o Realtime de Supabase.

## 3. Estilos y CSS
- **Tailwind CSS:** Todo el estilizado debe lograrse usando clases utilitarias de Tailwind CSS. No se deben crear archivos `.css` convencionales ni estilos inline en la medida de lo posible.
- **Iconos y Animaciones:** Se prefiere el uso de `lucide-react` para iconos y `framer-motion` para transiciones y animaciones fluidas, manteniendo el diseño de la aplicación consistente y moderno.

## 4. Estilo de Código (React)
- **Componentes Funcionales:** Utilizar exclusivamente Componentes Funcionales (Functional Components) de React.
- **Hooks:** Fomentar el uso extensivo de Hooks personalizados si la lógica se repite, manteniendo siempre el ciclo de vida gestionado vía `useEffect` y estado con `useState` o gestores globales.
- Se debe garantizar un código modular, donde cada componente esté en su propio archivo.

## 5. Control de Versiones (Git)
- **Nunca trabajar sobre `main`:** Antes de modificar código, si la rama actual es `main` se debe crear una rama nueva (`git checkout -b feat/nombre-descriptivo`). Los cambios llegan a `main` únicamente mediante Pull Request.
- **Prefijos de rama:** `feat/`, `fix/`, `refactor/`, `chore/` o `docs/` según el tipo de cambio.
- **Push y merge:** No ejecutar `git push` ni mergear a `main` salvo pedido explícito de la persona con la que se trabaja.
- **Reportar la rama:** Al terminar, indicar siempre en qué rama quedaron los commits.
- El flujo completo, la convención de commits y el checklist previo al Pull Request están documentados en [`CONTRIBUTING.md`](../CONTRIBUTING.md).
