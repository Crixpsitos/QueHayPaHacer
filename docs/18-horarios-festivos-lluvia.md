# 18 · Horarios: festivos y lluvia

Etapa 1 de las mejoras de sitios. Todo es **opcional**: un sitio sin dato queda "sin confirmar" y nunca se asume que abre ni que cierra.

## Qué declara el sitio (`openingPolicy`)
Campo opcional del documento `sites/{id}` (`domain/entities/sites/value-objects/SiteOpeningPolicy.ts`):
- `holidays`: `same` (abre con su horario normal), `custom` (otro horario, con `open`/`close`) o `closed`.
- `rain`: `open`, `partial` o `closed`, con una `note` opcional (≤120 caracteres). Es **informativo**: no se conecta ningún pronóstico del clima.
- `normalizeOpeningPolicy` limpia lo que llega (valores desconocidos, horas de festivo en una política que no es `custom`); el formulario lo valida además con valibot (`custom` exige horas).
- Se edita en el formulario del sitio, sección **Horario**. Una vez elegida una opción solo se puede cambiar, no borrar (la edición hace merge en Firestore).

## Festivos de Colombia
- **Cálculo por regla, sin API** (`domain/entities/holidays/colombiaHolidays.ts`): fijos, Semana Santa (algoritmo de Pascua) y traslados al lunes de la Ley Emiliani. Probado contra el calendario oficial 2026 y las reglas de 2025–2040.
- **Fuente de verdad editable:** colección `appConfig`, un documento por año (`holidays-2026`). Si existe, manda sobre el cálculo (p. ej. un decreto que mueve un festivo); si no, se calcula. `HolidayService` (`application/services/config/`).
- **Siembra opcional:** `pnpm exec tsx scripts/seed-holidays.ts 2026 2030 [--apply]` (dry-run por defecto; no pisa años ya editados). No hace falta para que la app funcione; solo sirve para poder editar un año en el panel.
- **Caché:** `getHolidaysAction` lee con `use cache` (`cacheLife("days")`, etiqueta `config-holidays`): una lectura de Firestore por instancia y día, no por visita.
- **Cliente:** `useColombiaHolidays` arranca con el cálculo por regla (instantáneo, sin red) y, si algún año tiene configuración propia, lo reemplaza con la versión cacheada del servidor. En desarrollo la primera respuesta tarda unos segundos por compilación.
- **Detalle público** (servidor): llama a la misma acción cacheada.

## Acciones para el panel de administración
`app/actions/config/admin-holidays.action.ts` (exigen sesión de administrador: `QHPA_ADMIN_UIDS`, ver `app/actions/_admin.ts`):
- `getHolidaysAdminAction(year)`, `saveHolidaysAction(year, holidays)` (valida fechas, año, nombre y tope de 40), `resetHolidaysAction(year)` (vuelve al cálculo).
- `refreshConfigCacheAction()`: **invalida la caché** (`updateTag("config-holidays")`). Guardar y restablecer ya la invalidan. Las rutas de bus (etapa 4) añadirán aquí su etiqueta.
- Un script que escribe directo en Firestore no invalida la caché: vence sola en ≤1 día.

## Cómo se ve
- `getSiteOpenStatus(schedule, now, { holidays, policy })` (`presentation/sites/lib/openStatus.ts`): si hoy es festivo aplica la política (`closed` → "Cerrado hoy · Festivo"; `custom` → horario de festivos). "Abre mañana" tiene en cuenta si mañana es festivo.
- El detalle muestra, bajo la tabla de horarios, un aviso "Hoy es festivo (…)" (con "confírmalo antes de ir" si el sitio no dijo qué hace), y las líneas **Festivos** y **Si llueve** (o "Sin confirmar"). La fila de hoy muestra el horario real de festivo y "hoy · festivo".
- Las tarjetas usan la misma lógica (solo cambia su etiqueta de abierto/cerrado).

## Límites conocidos
- Cierres pasada la medianoche: un horario 20:00–02:00 no se considera abierto de madrugada del día siguiente (ya era así).
- La lluvia no se detecta en vivo; es lo que el sitio declaró.
- Los avisos de festivo usan la hora de Colombia; un festivo que el administrador agrega a mano aparece cuando venza o se invalide la caché.
