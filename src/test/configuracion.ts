// Configuración común de los tests unitarios (Vitest sobre jsdom).
//
// Nada de esto toca la base compartida: los tests reemplazan las dependencias
// externas (cliente de Supabase, lectura del entorno) con TestBed. Correr contra
// el proyecto real dejaría filas basura que verían las tres personas del equipo
// y volvería los resultados no determinísticos.
//
// El runner de Angular no admite `vi.mock` sobre módulos propios (rutas
// relativas): por eso SupabaseService expone sus dependencias como tokens de
// inyección (LECTOR_DE_CONFIGURACION, BANDERA_TIEMPO_REAL, FABRICA_DE_CLIENTE).
export {};
