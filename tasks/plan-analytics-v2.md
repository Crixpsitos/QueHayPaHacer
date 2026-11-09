# Plan: `analytics-v2`

Spec: `SPEC-analytics-v2.md` (2026-11-08). Lista de tareas: `tasks/todo-analytics-v2.md` (archivo aparte: `tasks/plan.md` y `tasks/todo.md` son de otro trabajo y tienen ítems sin marcar).
Estado: BORRADOR para aprobación. No hay código.

## Resumen

Cinco módulos en este orden: `measure` → (`short-links` ∥ `intent`) → `funnel-report` → `ranking-v2`, precedidos por una línea base. Cada fase deja develop funcionando y se puede subir a prod por separado.

## Respuestas por defecto a las preguntas abiertas de la spec

El usuario no las respondió; adopto mi recomendación y queda escrito para que la cambie:

1. "Guardar" y "Voy a ir" **solo con sesión**.
2. "N personas van" visible desde **10**.
3. Estadísticas **gratis** en la primera versión; Premium se decide después con datos.
4. **Sin** pantalla intermedia en enlaces externos (se revisa si se abre la creación de enlaces a cualquiera).
5. Vista = **una por persona y día** (cambia la semántica; absorbida por el modo sombra del ranking).
6. Recordatorio "mañana es tu evento": **después** de v1.
7. Dominio corto: **después**. 8. QR: **después**.
9. Texto de privacidad: lo redacto como **borrador** para su revisión (tarea T7).

## Decisiones de arquitectura

- Eventos copian el patrón de sitios (beacon + doc diario `stats/{día}`), no se inventa uno nuevo.
- Clasificador de origen = función pura con lista cerrada (sin cardinalidad libre en Firestore).
- Salida rastreada **lee el destino del documento**, nunca de la URL (sin redirección abierta).
- Veredicto honesto = función pura con reglas fijas, testeable sin base de datos.
- Ranking nuevo **en modo sombra** primero; el orden visible no cambia sin aprobación y sin 14 días de datos.

## Grafo de dependencias

```
T0 línea base
   └─ measure:        T1 clasificador ─ T2 conteo ─ T3 ruta+guardas ─ T4 hook+vista ─ T5 acciones ─ T6 sitios ─ T7 privacidad ─ [CP-A]
                                                                                                                   │
        ┌──────────────────────────────────────────────────────────────────────────────────────────────────────────┤
        │ short-links:  T8 salida ─ T9 botones ─ T10 campaña ─ T11 "Mis enlaces" ─────────────────────────────── [CP-B]
        │ intent:       T12 Guardar ─ T13 Voy (datos) ─ T14 Voy (UI) ─────────────────────────────────────────── [CP-C]
        ▼
 funnel-report: T15 agregación+veredicto ─ T16 organizador ─ T17 sitios+enlaces ─ T18 admin ─ [CP-D]
        ▼
 ranking-v2:    T19 fórmula ─ T20 sombra ─ (14 días de datos) ─ T21 comparación ─ T22 cambio visible ─ T23 atajos ─ [CP-E]
```

## Cuánto se demora (estimación mía, sin verificar)

Mido en **sesiones de trabajo** (una sesión ≈ 1–3 horas de trabajo mío con tus revisiones), no en calendario, porque depende de qué tan rápido apruebes y pruebes.

| Fase | Sesiones | Notas |
|---|---|---|
| Línea base + `measure` (T0–T7) | 2 | Lo que arregla lo roto. Subir a develop y probar. |
| `short-links` (T8–T11) | 2 | Incluye la pantalla "Mis enlaces". |
| `intent` (T12–T14) | 2 | Puede ir en paralelo con `short-links`. |
| `funnel-report` (T15–T18) | 2–3 | La más grande de UI. |
| `ranking-v2` (T19–T23) | 1 + **espera de 14 días de datos** | El cambio visible no se puede acelerar: necesita datos reales. |
| **Total de trabajo** | **≈ 9–10 sesiones** | |

Calendario realista: construir y tener en prod `measure`, `short-links` e `intent` en **~1 semana** si probamos cada fase al terminarla; el informe para organizadores, **~2 semanas**; el nuevo orden de listas, **~4 semanas** (14 días de datos después de `measure` + comparación + tu aprobación). Las esperas son por datos y revisión, no por código.

## Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Cambiar la semántica de `views` (por persona y día) sube todos los puntajes de golpe | Alto | Modo sombra; el orden visible solo cambia en T22 con aprobación |
| Un doc `stats/{día}` tiene tope ~1 escritura/s | Med | Hoy sobra; documentado con `ponytail:`; buffer si se acerca |
| Ataque o bots inflan escrituras (costo) | Alto | Filtros previos, 120/min por instancia, `maxInstances` 5, alerta (pedir permiso para infra) |
| Redirección abierta / phishing con enlaces de salida | Alto | Destino solo desde documentos propios; solo dueños crean enlaces; revisión `security-auditor` |
| Reglas/índices de Firestore viven fuera del repo | Med | Preguntar antes (T10 y T13 lo listan); las rutas usan SDK admin |
| Sin navegador automático para probar (MCP caídos) | Med | Guion numerado de prueba para el usuario en cada checkpoint |
| Poco tráfico: porcentajes engañosos | Alto | Veredicto con mínimo de 30 vistas y números absolutos siempre visibles |
| Ranking está en el repo `../functions` (aparte, se despliega con permiso) | Med | T20 separa la parte de la app y la de functions; deploy solo con orden explícita |

## Orden de despliegue

Siempre: develop primero (avisar antes de `git push origin develop`: dispara rollout), probar, y luego prod con orden explícita (merge vía worktree temporal, avisar la hora). Functions antes que la app si son compatibles hacia atrás.

## Preguntas abiertas restantes

- Aprobar mapa de módulos y estas respuestas por defecto.
- ¿Quieres que arranque por T0 (línea base) apenas apruebes? (Es solo lectura; pide permiso para leer prod.)
