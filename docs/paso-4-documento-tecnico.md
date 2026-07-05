# Paso 4 — Documento técnico de pruebas

**Sistema:** QueHayPaHacer
**Tipo de prueba:** Pruebas unitarias (caja blanca)
**Archivo de pruebas:** `tests/business-logic.test.ts` · **Ejecución:** `npm test`

---

## 1. Nombre del sistema evaluado

**QueHayPaHacer** — plataforma web para la publicación y descubrimiento de eventos y sitios. Construida con Next.js 16, React 19 y TypeScript, bajo una arquitectura por capas (dominio / aplicación / infraestructura / presentación).

## 2. Objetivo de la prueba

Verificar que la lógica de negocio del sistema se comporte según sus reglas de dominio, comprobando de forma automática y repetible:

- Las **invariantes de publicación** de un sitio.
- El **cálculo del score** al publicar un evento.
- La **serialización segura de datos a CSV** (escape de caracteres y BOM UTF-8).

## 3. Tipo de prueba seleccionada

**Prueba unitaria (caja blanca).** Se evalúa cada unidad de código de forma aislada, conociendo su implementación interna y sus reglas de negocio, sin depender de la interfaz de usuario, la red ni la base de datos real.

## 4. Alcance

Se prueban **tres unidades independientes** de las capas de dominio y aplicación:

| Unidad | Capa | Qué valida |
|---|---|---|
| Entidad `Site` | Dominio | Reglas de publicación de un sitio. |
| Servicio `EventsService.publishEvent` | Aplicación | Cálculo del score al publicar (con un doble de prueba del repositorio). |
| Utilidad `toCsv` | Presentación | Serialización segura a CSV. |

**Fuera de alcance:** interfaz de usuario, peticiones de red, persistencia real en Firestore y descarga de archivos en el navegador.

## 5. Requerimientos a validar

| ID | Requerimiento |
|---|---|
| **RF1** | Un sitio **publicado** debe tener nombre, slug, descripción, dirección y **exactamente una** imagen de portada. Un **borrador** no exige esas validaciones. |
| **RF2** | Al publicar un evento **nuevo** de un autor **profesional**, su score recibe un incremento de **+10**. Un evento **existente** solo se actualiza, sin recalcular el score. |
| **RF3** | La exportación a CSV debe **escapar** comas, comillas y saltos de línea (RFC 4180) e incluir **BOM UTF-8** para que Excel respete los acentos. |

## 6. Escenarios de prueba

| Escenario | Descripción | Requerimiento |
|---|---|---|
| **E1** | Construir un sitio en distintos estados de publicación (borrador y publicado), con datos válidos e inválidos, y verificar que las invariantes se apliquen solo cuando corresponde. | RF1 |
| **E2** | Publicar eventos nuevos y existentes, con autor profesional y normal, usando un doble de prueba (mock) del repositorio para observar qué método se invoca y con qué score se persiste. | RF2 |
| **E3** | Serializar filas a CSV con celdas simples y con caracteres especiales (comas, comillas, acentos), verificando el escape y el BOM. | RF3 |

## 7. Casos de prueba (3)

### Caso CP-01 — Invariantes de publicación de un sitio (`Site`)

- **Requerimiento:** RF1 · **Escenario:** E1
- **Precondición:** Entidad `Site` y sus *value objects* disponibles.

| # | Datos de entrada | Resultado esperado | Resultado obtenido (simulado) | Estado |
|---|---|---|---|---|
| 1 | `estado="draft"`, `nombre=""`, `portadas=0` | `creado (borrador, sin validar)` | `creado (borrador, sin validar)` | PASÓ |
| 2 | `estado="published"`, `nombre="Café Central"`, `portadas=1` | `creado, markerUrl = https://cdn/marker.png` | idéntico | PASÓ |
| 3 | `estado="published"`, `nombre="Café Central"`, `portadas=0` | `Error: Debe haber exactamente una imagen de portada` | idéntico | PASÓ |
| 4 | `estado="published"`, `nombre="Café Central"`, `portadas=2` | `Error: Debe haber exactamente una imagen de portada` | idéntico | PASÓ |
| 5 | `estado="published"`, `nombre=""`, `portadas=1` | `Error: Nombre requerido` | idéntico | PASÓ |

### Caso CP-02 — Cálculo de score al publicar un evento (`EventsService.publishEvent`)

- **Requerimiento:** RF2 · **Escenario:** E2
- **Precondición:** `EventsService` construido con un mock de `IEventsRepository` que registra el método invocado y el `score` recibido.

| # | Datos de entrada | Resultado esperado | Resultado obtenido (simulado) | Estado |
|---|---|---|---|---|
| 1 | `id=null`, `autorProfesional=true`, `scoreBase=5` | `createEvent, score = 15` (+10 de boost) | `createEvent, score = 15` | PASÓ |
| 2 | `id=null`, `autorProfesional=false`, `scoreBase=5` | `createEvent, score = 5` (sin boost) | `createEvent, score = 5` | PASÓ |
| 3 | `id="e1"`, `autorProfesional=true`, `scoreBase=99` | `updateEvent (createEvent no llamado)` | `updateEvent (createEvent no llamado)` | PASÓ |

### Caso CP-03 — Exportación segura a CSV (`toCsv`)

- **Requerimiento:** RF3 · **Escenario:** E3
- **Precondición:** Utilidad `toCsv(headers, filas)` disponible. En la evidencia, `[BOM]` marca el BOM invisible (U+FEFF) al inicio y `\n` el salto de línea.

| # | Datos de entrada | Resultado esperado | Resultado obtenido (simulado) | Estado |
|---|---|---|---|---|
| 1 | `headers=["Nombre","Edad"]`, `filas=[["Ana","30"]]` | `[BOM]Nombre,Edad\nAna,30` | idéntico | PASÓ |
| 2 | `headers=["Nombre","Cita"]`, `filas=[["Pérez, Juan", 'dijo "hola"']]` | `[BOM]Nombre,Cita\n"Pérez, Juan","dijo ""hola"""` | idéntico | PASÓ |
| 3 | `headers=["Ciudad"]`, `filas=[["Bogotá"]]` | `[BOM]Ciudad\nBogotá` | idéntico | PASÓ |

## 8. Datos de entrada

Los datos de entrada de cada sub-caso están especificados como **valores planos** en la columna "Datos de entrada" de las tablas del punto 7 (por ejemplo `nombre="Café Central"`, `portadas=1`, `scoreBase=5`). No se usan expresiones de código como entrada, para que la prueba sea legible y reproducible por cualquier revisor.

## 9. Resultado esperado

Definido por sub-caso en la columna "Resultado esperado" del punto 7. Resume el comportamiento correcto según cada requerimiento: creación permitida o denegada con el mensaje de error exacto (RF1), método persistido y score calculado (RF2), y cadena CSV escapada con BOM (RF3).

## 10. Resultado obtenido (simulado)

Columna "Resultado obtenido (simulado)" del punto 7. Se obtiene ejecutando `npm test`, que corre las pruebas con el runner nativo de Node 22 (`node:test` + `node:assert`) transpilado con `tsx`. Los 11 sub-casos de los tres casos válidos **coinciden** con el resultado esperado (estado PASÓ).

## 11. Evidencias o capturas de pantalla

Al ejecutar `npm test` se imprime en consola un árbol de sub-tests con el resultado de cada uno y un resumen final:

```
▶ Test 1: Publicación de un sitio
  ✔ sub-test-1: creación aprobada (borrador incompleto se permite)
  ✔ sub-test-2: creación aprobada (publicado completo con 1 portada)
  ✔ sub-test-3: creación denegada (publicado sin portada)
  ✔ sub-test-4: creación denegada (publicado con 2 portadas)
  ✔ sub-test-5: creación denegada (publicado sin nombre)
▶ Test 2: Publicación de evento con score profesional
  ✔ sub-test-1: aprobada (evento nuevo, autor profesional → +10)
  ✔ sub-test-2: aprobada (evento nuevo, autor normal → sin boost)
  ✔ sub-test-3: denegada boost (evento existente → update, sin recalcular)
▶ Test 3: Exportación de datos a CSV
  ✔ sub-test-1: aprobada (celdas simples, sin caracteres especiales)
  ✔ sub-test-2: aprobada (escape RFC: comas y comillas dentro de la celda)
  ✔ sub-test-3: aprobada (BOM UTF-8 al inicio → acentos correctos en Excel)
▶ Test 4: Detección de fallos (casos INTENCIONALMENTE incorrectos)
  ✖ sub-test-1: FALLA a propósito · CSV que se esperaba SIN escapar
  ✖ sub-test-2: FALLA a propósito · score sin el boost profesional
ℹ tests 14
ℹ pass 14
ℹ fail 3
```

> **Capturas a adjuntar en el informe:**
> 1. Salida de consola de `npm test` (la de arriba).
> 2. Reporte visual HTML `tests/reporte-pruebas.html` — tabla agrupada por caso con datos de entrada / esperado / recibido / origen por sub-test.
> 3. Reporte de fallos `tests/reporte-fallos.html` — diff carácter a carácter y grilla CSV que evidencia la detección de errores (ver punto siguiente).

**Nota sobre la detección de fallos (Test 4):** la suite incluye a propósito **dos casos incorrectos** (el valor esperado se escribió mal) para demostrar que las pruebas **detectan** errores, no solo confirman aciertos. Por eso `npm test` reporta `fail 3` (2 sub-tests + su test padre). Esto es evidencia de la sensibilidad de las pruebas y se documenta en detalle en el análisis crítico (Paso 6).
