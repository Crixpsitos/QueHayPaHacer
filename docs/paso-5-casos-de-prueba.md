# Paso 5 — Casos de prueba documentados (3)

> Documentación formal de los tres casos de prueba unitarios ejecutados sobre el sistema **QueHayPaHacer**.
> Archivo de pruebas: `tests/business-logic.test.ts` · Ejecución: `npm test`

---

## Caso de prueba CP-01 — Invariantes de publicación de un sitio

| Campo | Detalle |
|---|---|
| **ID** | CP-01 |
| **Título** | Invariantes de publicación de la entidad `Site` |
| **Requerimiento** | RF1 |
| **Objetivo** | Verificar que un sitio solo se publique cuando cumple todas sus reglas (nombre, slug, descripción, dirección y exactamente una portada), y que un borrador se permita sin esas validaciones. |
| **Unidad probada** | Entidad `Site` (capa de dominio) |
| **Precondiciones** | Entidad `Site` y sus *value objects* (`Coordinates`, `SiteLocation`, `Schedule`, `ImageMedia`) disponibles. |
| **Tipo** | Unitaria (caja blanca) |

**Sub-casos:**

| # | Descripción | Datos de entrada | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|
| 1 | Borrador incompleto se permite | `estado="draft"`, `nombre=""`, `portadas=0` | `creado (borrador, sin validar)` | `creado (borrador, sin validar)` | PASÓ |
| 2 | Publicado completo con 1 portada | `estado="published"`, `nombre="Café Central"`, `portadas=1` | `creado, markerUrl = https://cdn/marker.png` | idéntico | PASÓ |
| 3 | Publicado sin portada se rechaza | `estado="published"`, `nombre="Café Central"`, `portadas=0` | `Error: Debe haber exactamente una imagen de portada` | idéntico | PASÓ |
| 4 | Publicado con 2 portadas se rechaza | `estado="published"`, `nombre="Café Central"`, `portadas=2` | `Error: Debe haber exactamente una imagen de portada` | idéntico | PASÓ |
| 5 | Publicado sin nombre se rechaza | `estado="published"`, `nombre=""`, `portadas=1` | `Error: Nombre requerido` | idéntico | PASÓ |

| Campo | Detalle |
|---|---|
| **Postcondición** | Un sitio en borrador se construye siempre; un sitio publicado solo se construye si cumple las invariantes, de lo contrario lanza el error específico. |
| **Resultado global** | ✅ 5/5 sub-casos aprobados |

---

## Caso de prueba CP-02 — Cálculo de score al publicar un evento

| Campo | Detalle |
|---|---|
| **ID** | CP-02 |
| **Título** | Boost de score profesional en `EventsService.publishEvent` |
| **Requerimiento** | RF2 |
| **Objetivo** | Verificar que al publicar un evento **nuevo** de un autor profesional el score reciba +10, que un autor normal no reciba boost, y que un evento **existente** solo se actualice sin recalcular el score. |
| **Unidad probada** | Servicio `EventsService.publishEvent` (capa de aplicación) |
| **Precondiciones** | `EventsService` construido con un **doble de prueba (mock)** de `IEventsRepository` que registra el método invocado (`createEvent` / `updateEvent`) y el `score` recibido. |
| **Tipo** | Unitaria (caja blanca) con doble de prueba |

**Sub-casos:**

| # | Descripción | Datos de entrada | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|
| 1 | Evento nuevo, autor profesional → +10 | `id=null`, `autorProfesional=true`, `scoreBase=5` | `createEvent, score = 15` | `createEvent, score = 15` | PASÓ |
| 2 | Evento nuevo, autor normal → sin boost | `id=null`, `autorProfesional=false`, `scoreBase=5` | `createEvent, score = 5` | `createEvent, score = 5` | PASÓ |
| 3 | Evento existente → update, sin recalcular | `id="e1"`, `autorProfesional=true`, `scoreBase=99` | `updateEvent (createEvent no llamado)` | `updateEvent (createEvent no llamado)` | PASÓ |

| Campo | Detalle |
|---|---|
| **Postcondición** | El repositorio recibe `createEvent` con el score correcto (con o sin boost) solo en eventos nuevos; en eventos existentes recibe `updateEvent`. |
| **Resultado global** | ✅ 3/3 sub-casos aprobados |

---

## Caso de prueba CP-03 — Exportación segura a CSV

| Campo | Detalle |
|---|---|
| **ID** | CP-03 |
| **Título** | Escape RFC 4180 y BOM UTF-8 en `toCsv` |
| **Requerimiento** | RF3 |
| **Objetivo** | Verificar que la exportación a CSV escape comas y comillas dentro de las celdas y anteponga el BOM UTF-8, para que Excel abra el archivo con acentos correctos y sin romper columnas. |
| **Unidad probada** | Utilidad `toCsv(headers, filas)` (capa de presentación) |
| **Precondiciones** | Función `toCsv` disponible. En la evidencia, `[BOM]` representa el carácter invisible U+FEFF al inicio y `\n` el salto de línea. |
| **Tipo** | Unitaria (caja blanca) |

**Sub-casos:**

| # | Descripción | Datos de entrada | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|
| 1 | Celdas simples, sin caracteres especiales | `headers=["Nombre","Edad"]`, `filas=[["Ana","30"]]` | `[BOM]Nombre,Edad\nAna,30` | idéntico | PASÓ |
| 2 | Escape de comas y comillas dentro de la celda | `headers=["Nombre","Cita"]`, `filas=[["Pérez, Juan", 'dijo "hola"']]` | `[BOM]Nombre,Cita\n"Pérez, Juan","dijo ""hola"""` | idéntico | PASÓ |
| 3 | BOM y acentos correctos | `headers=["Ciudad"]`, `filas=[["Bogotá"]]` | `[BOM]Ciudad\nBogotá` | idéntico | PASÓ |

| Campo | Detalle |
|---|---|
| **Postcondición** | La cadena CSV siempre inicia con BOM; las celdas con comas o comillas quedan entre comillas dobles y las comillas internas se duplican. |
| **Resultado global** | ✅ 3/3 sub-casos aprobados |

---

## Resumen de ejecución

| Caso | Unidad | Requerimiento | Sub-casos | Estado |
|---|---|---|---|---|
| CP-01 | `Site` | RF1 | 5/5 | ✅ APROBADO |
| CP-02 | `EventsService.publishEvent` | RF2 | 3/3 | ✅ APROBADO |
| CP-03 | `toCsv` | RF3 | 3/3 | ✅ APROBADO |

Los **11 sub-casos** de los tres casos válidos pasan. La suite incluye además un **Test 4** con dos casos intencionalmente incorrectos (documentados en el Paso 6) que demuestran la capacidad de detección de fallos; por eso `npm test` reporta `fail 3`.
