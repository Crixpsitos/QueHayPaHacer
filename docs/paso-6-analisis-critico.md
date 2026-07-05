# Paso 6 — Análisis crítico

> Análisis crítico de las pruebas unitarias realizadas sobre el sistema **QueHayPaHacer**.

---

## 1. Posibles fallos encontrados

- **Errores de dominio genéricos.** Las invariantes de `Site` lanzan `Error` genérico con mensaje en español (`"Nombre requerido"`, `"Debe haber exactamente una imagen de portada"`), sin tipo ni código propio. Esto dificulta distinguirlos programáticamente en las capas superiores (no se puede hacer `catch` selectivo por tipo de error).
- **Decisión crear/actualizar frágil.** `EventsService.publishEvent` decide entre crear y actualizar según la **presencia de `id`**. Si un evento nuevo llegara con un `id` pre-asignado, se saltaría el cálculo del score sin ningún aviso.
- **Boost de score no auditable.** El incremento de +10 al autor profesional está codificado como constante interna del servicio; no es configurable ni queda registro (log) de cuándo se aplica.
- **Acoplamiento de `toCsv` al navegador.** La función escapa correctamente los datos, pero delega la descarga en `document`/`Blob`, lo que la acopla al entorno del navegador (fuera del alcance de la prueba unitaria).

### Detección de fallos verificada (Test 4)

Para comprobar que las pruebas **detectan errores** y no solo confirman aciertos, la suite incluye dos casos **intencionalmente incorrectos** (el valor esperado se escribió mal a propósito). Al ejecutarse, `npm test` reporta `fail 3` (2 sub-casos + su test padre):

| Caso | Datos de entrada | Esperado (incorrecto a propósito) | Recibido (real) | Estado |
|---|---|---|---|---|
| CSV sin escapar | `filas=[["Pérez, Juan", 'dijo "hola"']]` | `[BOM]Nombre,Cita\nPérez, Juan,dijo "hola"` | `[BOM]Nombre,Cita\n"Pérez, Juan","dijo ""hola"""` | ❌ FALLÓ |
| Score sin boost | `id=null`, `autorProfesional=true`, `scoreBase=5` | `createEvent, score = 5` | `createEvent, score = 15` | ❌ FALLÓ |

El reporte `tests/reporte-fallos.html` muestra el diff carácter a carácter y, para el CSV, la reconstrucción en grilla que evidencia que `Pérez, Juan` se parte en dos columnas al no escaparse. Esto demuestra que las pruebas son **sensibles**: si la lógica se rompiera de verdad, fallarían igual.

## 2. Riesgos del sistema

- **Datos que evaden los constructores.** Objetos hidratados directamente desde Firestore (sin pasar por el constructor de `Site` ni por `EventsService`) podrían evadir las validaciones de dominio.
- **Ausencia previa de pruebas.** Antes de este trabajo el proyecto **no tenía suite de pruebas**; cualquier regresión en estas reglas de negocio pasaría inadvertida hasta producción.
- **Impacto del score en el ranking.** La lógica del score profesional influye en el orden en que se muestran los eventos a los usuarios; un error silencioso ahí degrada la relevancia percibida sin que nadie lo note.

## 3. Recomendaciones de mejora

- Definir **errores de dominio tipados** (por ejemplo `SitePublicationError`) en lugar de `Error` genérico, para permitir manejo selectivo en capas superiores.
- **Externalizar** el valor del boost profesional a configuración y **registrar (log)** cada vez que se aplica, para hacerlo auditable.
- Añadir una **validación** de que un evento "nuevo" no traiga `id`, blindando la rama de creación.
- **Ampliar la suite** a más servicios (`SitesService`, `EventInteractionsService`) e integrarla en **CI** para bloquear *merges* con pruebas en rojo.

## 4. Importancia del proceso de pruebas antes de la implementación final

Estas pruebas unitarias verifican las reglas de negocio **en el punto donde se aplican** (la entidad y el servicio), no cuando el usuario ya vio un dato incorrecto. Aportan cuatro beneficios concretos:

1. **Detección temprana y automática** de regresiones, de forma repetible en cada ejecución de `npm test`.
2. **Documentación viva** del comportamiento esperado de cada regla (invariantes de publicación, boost de score, escape CSV): la prueba describe qué debe pasar.
3. **Confianza para refactorizar**, porque cualquier cambio que rompa una regla se detecta de inmediato.
4. **Reducción de riesgo** de publicar un sistema con validaciones rotas o con datos corruptos exportados a los organizadores.

Ejecutar estas pruebas **antes** de la implementación final —y no después de desplegar— es lo que separa un fallo detectado en el escritorio de un fallo detectado por el usuario en producción. El costo de corregir crece en cada etapa que el error avanza sin ser detectado; las pruebas unitarias lo cortan en la etapa más barata.
