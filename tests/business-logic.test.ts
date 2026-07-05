import { test, after } from "node:test"
import assert from "node:assert/strict"
import { writeFileSync } from "node:fs"
import { pathToFileURL } from "node:url"

import { Site } from "@/domain/entities/sites/Site"
import { Coordinates } from "@/domain/entities/sites/value-objects/Coordinates"
import { SiteLocation } from "@/domain/entities/sites/value-objects/SiteLocation"
import { Schedule, type DaySchedule } from "@/domain/entities/sites/value-objects/Schedule"
import { ImageMedia } from "@/domain/entities/sites/value-objects/ImageMedia"
import { SiteAnalytics } from "@/domain/entities/sites/value-objects/SiteAnalytics"
import type { SiteMedia } from "@/domain/entities/sites/value-objects/SiteMedia"
import type { SitePublicationStatus } from "@/domain/entities/sites/value-objects/SitePublicationStatus"

import { EventsService } from "@/application/services/events/EventsService"
import type { IEventsRepository } from "@/domain/repository/events/IEventsRepository"
import type { IStorageService } from "@/domain/services/storage/IStorageService"
import type { Events } from "@/domain/entities/events/Events"

import { toCsv } from "@/presentation/studio/lib/csv"

// ─── Tablero de resultados ───────────────────────────────────────────────────
type Fila = {
  "Grupo": string
  "Sub-test": string
  "Datos de entrada": string
  "Esperado": string
  "Recibido": string
  "Origen": string
  "Estado": string
}
const tablero: Fila[] = []

// Grupos = los tests padre del documento. Los sub-tests se muestran anidados.
const G1 = "🏢 Test 1 · Publicación de un sitio — entidad Site"
const G2 = "🎫 Test 2 · Publicación de evento con score — EventsService"
const G3 = "📄 Test 3 · Exportación de datos a CSV — toCsv"
const G4 = "🐞 Test 4 · Detección de fallos (casos intencionalmente incorrectos)"

// Extrae el primer frame de código del proyecto (archivo.ts:línea) del stack de
// un error, ignorando el propio archivo de test, node_modules y core de Node.
function origenDeError(stack?: string): string {
  if (!stack) return ""
  for (const linea of stack.split("\n")) {
    if (linea.includes("business-logic.test.ts")) continue
    if (linea.includes("node_modules") || linea.includes("node:")) continue
    const m = linea.match(/([^/\\(]+\.ts):(\d+):\d+/)
    if (m) return `${m[1]}:${m[2]}`
  }
  return ""
}

// Formatea los datos de entrada como valores planos legibles: `campo = valor`
// (una línea por campo). NO expresiones de código — solo los datos que entran.
function fmtEntrada(entrada: Record<string, unknown>): string {
  return Object.entries(entrada)
    .map(([campo, valor]) => `${campo} = ${JSON.stringify(valor)}`)
    .join("\n")
}

// Ejecuta el caso (sync o async), compara esperado vs recibido, registra y afirma.
// Si el código lanza, guarda DÓNDE lo hizo (archivo:línea) en la columna Origen.
async function verificar(
  grupo: string,
  sub: string,
  entrada: Record<string, unknown>,
  esperado: string,
  ejecutar: () => string | Promise<string>,
) {
  let recibido: string
  let origen = "—"
  try {
    recibido = await ejecutar()
  } catch (e) {
    recibido = `Error: ${(e as Error).message}`
    origen = origenDeError((e as Error).stack) || "—"
  }
  const paso = recibido === esperado
  // Si NO pasó por mismatch (no por excepción), señala la diferencia.
  if (!paso && origen === "—") origen = "esperado ≠ recibido"
  tablero.push({
    "Grupo": grupo,
    "Sub-test": sub,
    "Datos de entrada": fmtEntrada(entrada),
    "Esperado": esperado,
    "Recibido": recibido,
    "Origen": origen,
    "Estado": paso ? "✅ PASÓ" : "❌ FALLÓ",
  })
  assert.equal(recibido, esperado)
}

// ─── Helpers de construcción ─────────────────────────────────────────────────
const cover = (isCover: boolean, id = "m1") =>
  new ImageMedia(id, "https://cdn/c.png", 800, 600, "alt", "https://cdn/marker.png", isCover)

function makeSite(o: Partial<{
  name: string; slug: string; description: string; address: string
  media: SiteMedia[]; publicationStatus: SitePublicationStatus
}> = {}): Site {
  const location = new SiteLocation(
    new Coordinates(4.7, -74.07), "co", "Colombia", "cun", "Cundinamarca", "bog", "Bogotá",
    o.address ?? "Calle 1 #2-3",
  )
  const day: DaySchedule = { open: "09:00", close: "18:00", closed: false }
  const schedule = new Schedule(day, day, day, day, day, day, day)
  return new Site(
    "s1",
    o.name ?? "Café Central",
    o.slug ?? "cafe-central",
    o.description ?? "Un café acogedor",
    location,
    o.media ?? [cover(true)],
    schedule,
    { uid: "u1", displayName: "Autor", photoURL: "" },
    o.publicationStatus ?? "published",
    "approved",
    true,
    new SiteAnalytics(0, 0, 0, 0),
    new Date(), new Date(),
  )
}

// Mock del repositorio de eventos: registra qué método se llamó y con qué score.
function makeEventsRepo() {
  const llamadas: { metodo: string; score?: number }[] = []
  const repo = {
    createEvent: async (e: Events) => {
      llamadas.push({ metodo: "createEvent", score: e.analytics?.score })
      return e
    },
    updateEvent: async (e: Events) => {
      llamadas.push({ metodo: "updateEvent", score: e.analytics?.score })
    },
  } as unknown as IEventsRepository
  return { repo, llamadas }
}
const storageStub = {} as unknown as IStorageService

// ═══ Test 1: Reglas de publicación de un sitio (entidad Site) ═════════════════
test("Test 1: Publicación de un sitio", async (t) => {
  await t.test("sub-test-1: creación aprobada (borrador incompleto se permite)", () =>
    verificar(
      G1, "aprobada · borrador",
      { estado: "draft", nombre: "", portadas: 0 },
      "creado (borrador, sin validar)",
      () => {
        makeSite({ publicationStatus: "draft", name: "", media: [] })
        return "creado (borrador, sin validar)"
      },
    ))

  await t.test("sub-test-2: creación aprobada (publicado completo con 1 portada)", () =>
    verificar(
      G1, "aprobada · publicado",
      { estado: "published", nombre: "Café Central", portadas: 1 },
      "creado, markerUrl = https://cdn/marker.png",
      () => {
        const s = makeSite({ publicationStatus: "published" })
        return `creado, markerUrl = ${s.markerImageUrl}`
      },
    ))

  await t.test("sub-test-3: creación denegada (publicado sin portada)", () =>
    verificar(
      G1, "denegada · sin portada",
      { estado: "published", nombre: "Café Central", portadas: 0 },
      "Error: Debe haber exactamente una imagen de portada",
      () => {
        makeSite({ publicationStatus: "published", media: [] })
        return "creado"
      },
    ))

  await t.test("sub-test-4: creación denegada (publicado con 2 portadas)", () =>
    verificar(
      G1, "denegada · 2 portadas",
      { estado: "published", nombre: "Café Central", portadas: 2 },
      "Error: Debe haber exactamente una imagen de portada",
      () => {
        makeSite({ publicationStatus: "published", media: [cover(true, "m1"), cover(true, "m2")] })
        return "creado"
      },
    ))

  await t.test("sub-test-5: creación denegada (publicado sin nombre)", () =>
    verificar(
      G1, "denegada · sin nombre",
      { estado: "published", nombre: "", portadas: 1 },
      "Error: Nombre requerido",
      () => {
        makeSite({ publicationStatus: "published", name: "" })
        return "creado"
      },
    ))
})

// ═══ Test 2: Publicar evento con boost de score (EventsService) ═══════════════
// Regla de negocio: un evento NUEVO de autor profesional recibe +10 al score.
test("Test 2: Publicación de evento con score profesional", async (t) => {
  await t.test("sub-test-1: aprobada (evento nuevo, autor profesional → +10)", () =>
    verificar(
      G2, "aprobada · profesional",
      { id: null, autorProfesional: true, scoreBase: 5 },
      "createEvent, score = 15",
      async () => {
        const { repo, llamadas } = makeEventsRepo()
        const svc = new EventsService(repo, storageStub)
        await svc.publishEvent({ analytics: { score: 5 } } as Partial<Events>, { isProfessionalAuthor: true })
        return `${llamadas[0].metodo}, score = ${llamadas[0].score}`
      },
    ))

  await t.test("sub-test-2: aprobada (evento nuevo, autor normal → sin boost)", () =>
    verificar(
      G2, "aprobada · normal",
      { id: null, autorProfesional: false, scoreBase: 5 },
      "createEvent, score = 5",
      async () => {
        const { repo, llamadas } = makeEventsRepo()
        const svc = new EventsService(repo, storageStub)
        await svc.publishEvent({ analytics: { score: 5 } } as Partial<Events>)
        return `${llamadas[0].metodo}, score = ${llamadas[0].score}`
      },
    ))

  await t.test("sub-test-3: denegada boost (evento existente → update, sin recalcular)", () =>
    verificar(
      G2, "denegada · existente",
      { id: "e1", autorProfesional: true, scoreBase: 99 },
      "updateEvent (createEvent no llamado)",
      async () => {
        const { repo, llamadas } = makeEventsRepo()
        const svc = new EventsService(repo, storageStub)
        await svc.publishEvent({ id: "e1", analytics: { score: 99 } } as Partial<Events>, { isProfessionalAuthor: true })
        const usoCreate = llamadas.some((l) => l.metodo === "createEvent")
        return `${llamadas[0].metodo}${usoCreate ? "" : " (createEvent no llamado)"}`
      },
    ))
})

// ═══ Test 3: Exportación CSV (toCsv) ═════════════════════════════════════════
// Muestra la salida como texto plano: el BOM (U+FEFF, invisible) se marca como
// [BOM] y el salto de línea como \n, para que la evidencia sea legible.
const show = (s: string) => s.replace(/﻿/g, "[BOM]").replace(/\n/g, "\\n")

test("Test 3: Exportación de datos a CSV", async (t) => {
  await t.test("sub-test-1: aprobada (celdas simples, sin caracteres especiales)", () =>
    verificar(
      G3, "aprobada · simple",
      { headers: ["Nombre", "Edad"], filas: [["Ana", "30"]] },
      "[BOM]Nombre,Edad\\nAna,30",
      () => show(toCsv(["Nombre", "Edad"], [["Ana", "30"]])),
    ))

  await t.test("sub-test-2: aprobada (escape RFC: comas y comillas dentro de la celda)", () =>
    verificar(
      G3, "aprobada · escape",
      { headers: ["Nombre", "Cita"], filas: [["Pérez, Juan", 'dijo "hola"']] },
      '[BOM]Nombre,Cita\\n"Pérez, Juan","dijo ""hola"""',
      () => show(toCsv(["Nombre", "Cita"], [["Pérez, Juan", 'dijo "hola"']])),
    ))

  await t.test("sub-test-3: aprobada (BOM UTF-8 al inicio → acentos correctos en Excel)", () =>
    verificar(
      G3, "aprobada · BOM y acentos",
      { headers: ["Ciudad"], filas: [["Bogotá"]] },
      "[BOM]Ciudad\\nBogotá",
      () => show(toCsv(["Ciudad"], [["Bogotá"]])),
    ))
})

// ═══ Test 4: Detección de fallos (casos INTENCIONALMENTE incorrectos) ════════
// Estos 2 casos fallan A PROPÓSITO: el `esperado` está mal escrito adrede para
// demostrar que las pruebas y el reporte DETECTAN la discrepancia (fila roja +
// diff en consola). No indican un bug del software: el `recibido` es correcto.
test("Test 4: Detección de fallos (casos INTENCIONALMENTE incorrectos)", async (t) => {
  await t.test("sub-test-1: FALLA a propósito · CSV que se esperaba SIN escapar", () =>
    verificar(
      G4, "FALLA · escape incorrecto",
      { headers: ["Nombre", "Cita"], filas: [["Pérez, Juan", 'dijo "hola"']] },
      "[BOM]Nombre,Cita\\nPérez, Juan,dijo \"hola\"", // esperado INCORRECTO (sin comillas de escape)
      () => show(toCsv(["Nombre", "Cita"], [["Pérez, Juan", 'dijo "hola"']])),
    ))

  await t.test("sub-test-2: FALLA a propósito · score sin el boost profesional", () =>
    verificar(
      G4, "FALLA · boost olvidado",
      { id: null, autorProfesional: true, scoreBase: 5 },
      "createEvent, score = 5", // esperado INCORRECTO (ignora el +10 profesional)
      async () => {
        const { repo, llamadas } = makeEventsRepo()
        const svc = new EventsService(repo, storageStub)
        await svc.publishEvent({ analytics: { score: 5 } } as Partial<Events>, { isProfessionalAuthor: true })
        return `${llamadas[0].metodo}, score = ${llamadas[0].score}`
      },
    ))
})

// ─── Reporte visual (HTML) ───────────────────────────────────────────────────
const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

function renderHtml(rows: Fila[]): string {
  const ok = rows.filter((r) => r.Estado.includes("PASÓ")).length
  const fail = rows.length - ok
  const rowHtml = (r: Fila) => {
    const paso = r.Estado.includes("PASÓ")
    return `<tr class="${paso ? "ok" : "fail"}">
      <td class="sub">${esc(r["Sub-test"])}</td>
      <td><code>${esc(r["Datos de entrada"])}</code></td>
      <td><code>${esc(r.Esperado)}</code></td>
      <td><code>${esc(r.Recibido)}</code></td>
      <td><code class="org">${esc(r.Origen)}</code></td>
      <td class="st">${esc(r.Estado)}</td></tr>`
  }
  // Agrupa por test padre: una fila-cabecera por grupo, sub-tests anidados.
  const grupos = [...new Set(rows.map((r) => r.Grupo))]
  const trs = grupos.map((g) => {
    const gr = rows.filter((r) => r.Grupo === g)
    const okG = gr.filter((r) => r.Estado.includes("PASÓ")).length
    const cls = okG === gr.length ? "grp gok" : "grp gfail"
    return `<tr class="${cls}"><td colspan="6">${esc(g)}` +
      `<span class="cnt">${okG}/${gr.length} ✔</span></td></tr>\n` +
      gr.map(rowHtml).join("\n")
  }).join("\n")
  return `<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Reporte de pruebas — QueHayPaHacer</title>
<style>
  :root{color-scheme:light dark}
  body{font:15px/1.5 system-ui,sans-serif;margin:0;padding:2rem;background:#f6f7f9;color:#1a1a1a}
  @media(prefers-color-scheme:dark){body{background:#15171a;color:#e8e8e8}}
  h1{font-size:1.4rem;margin:0 0 .25rem}
  .sub{color:#888;margin:0 0 1.25rem}
  .chips{display:flex;gap:.75rem;flex-wrap:wrap;margin-bottom:1.25rem}
  .chip{padding:.5rem 1rem;border-radius:10px;font-weight:600}
  .chip.t{background:#e5e9f0;color:#333}.chip.p{background:#dcfce7;color:#166534}.chip.f{background:#fee2e2;color:#991b1b}
  @media(prefers-color-scheme:dark){.chip.t{background:#2a2e35;color:#ddd}}
  .wrap{overflow-x:auto;border-radius:12px;box-shadow:0 1px 3px #0002}
  table{border-collapse:collapse;width:100%;background:#fff;min-width:960px}
  @media(prefers-color-scheme:dark){table{background:#1d2025}}
  th{background:#2f343d;color:#fff;text-align:left;padding:.65rem .8rem;font-size:.8rem;text-transform:uppercase;letter-spacing:.03em;position:sticky;top:0}
  td{padding:.6rem .8rem;border-top:1px solid #0001;vertical-align:top}
  code{font:13px ui-monospace,monospace;background:#0000000a;padding:.1rem .35rem;border-radius:5px;white-space:pre-wrap}
  @media(prefers-color-scheme:dark){code{background:#ffffff12}}
  tr.ok{border-left:4px solid #16a34a}tr.fail{border-left:4px solid #dc2626}
  tr.fail td{background:#fef2f2}@media(prefers-color-scheme:dark){tr.fail td{background:#3a1d1d}}
  td.st{font-weight:700;white-space:nowrap}
  code.org{background:none;color:#6366f1;font-size:12px}
  /* Cabeceras de grupo (test padre) + anidado de sub-tests */
  tr.grp td{background:#3b4252;color:#fff;font-weight:700;font-size:.92rem;padding:.7rem .8rem;border-top:3px solid #0003;position:static}
  tr.grp.gfail td{background:#7f1d1d}
  tr.grp .cnt{float:right;font-weight:600;opacity:.85}
  td.sub{position:relative;padding-left:1.8rem;font-weight:600}
  td.sub::before{content:"└─";position:absolute;left:.55rem;color:#9aa;font-weight:400}
</style></head><body>
<h1>Reporte de pruebas unitarias — QueHayPaHacer</h1>
<p class="sub">${new Date().toLocaleString("es-CO")}</p>
<div class="chips">
  <span class="chip t">Total: ${rows.length}</span>
  <span class="chip p">✅ Pasaron: ${ok}</span>
  <span class="chip f">❌ Fallaron: ${fail}</span>
</div>
${fail > 0 ? `<p><a href="./reporte-fallos.html" style="color:#dc2626;font-weight:600">→ Ver detalle visual de los ${fail} fallo(s) (diff + grilla CSV)</a></p>` : ""}
<div class="wrap"><table>
<thead><tr><th>Sub-test</th><th>Datos de entrada</th><th>Esperado</th><th>Recibido</th><th>Origen</th><th>Estado</th></tr></thead>
<tbody>${trs}</tbody></table></div>
</body></html>`
}

// ─── Visual de fallos: diff carácter-a-carácter + grilla CSV ─────────────────
// Parser CSV mínimo (RFC 4180) para reconstruir la grilla desde la cadena de
// evidencia (revierte los tokens [BOM] y \n a caracteres reales).
function parseCsv(evidencia: string): string[][] {
  const texto = evidencia.replace(/^\[BOM\]/, "").replace(/\\n/g, "\n")
  const filas: string[][] = []
  let fila: string[] = [], celda = "", enComillas = false, i = 0
  while (i < texto.length) {
    const c = texto[i]
    if (enComillas) {
      if (c === '"' && texto[i + 1] === '"') { celda += '"'; i += 2; continue }
      if (c === '"') { enComillas = false; i++; continue }
      celda += c; i++; continue
    }
    if (c === '"') { enComillas = true; i++; continue }
    if (c === ",") { fila.push(celda); celda = ""; i++; continue }
    if (c === "\n") { fila.push(celda); filas.push(fila); fila = []; celda = ""; i++; continue }
    celda += c; i++
  }
  fila.push(celda); filas.push(fila)
  return filas
}

// Resalta la zona que difiere entre esperado y recibido (prefijo/sufijo común).
function diffCaracter(esperado: string, recibido: string) {
  let p = 0
  while (p < esperado.length && p < recibido.length && esperado[p] === recibido[p]) p++
  let s = 0
  while (s < esperado.length - p && s < recibido.length - p &&
    esperado[esperado.length - 1 - s] === recibido[recibido.length - 1 - s]) s++
  const marca = (t: string, cls: string) => `<mark class="${cls}">${esc(t) || "∅"}</mark>`
  return {
    esperado: esc(esperado.slice(0, p)) + marca(esperado.slice(p, esperado.length - s), "exp") + esc(esperado.slice(esperado.length - s)),
    recibido: esc(recibido.slice(0, p)) + marca(recibido.slice(p, recibido.length - s), "rec") + esc(recibido.slice(recibido.length - s)),
  }
}

// Grilla CSV: dos tablas (esperado vs recibido) con celdas divergentes marcadas.
function gridCsv(esperado: string, recibido: string): string {
  const ge = parseCsv(esperado), gr = parseCsv(recibido)
  const filas = Math.max(ge.length, gr.length)
  const tabla = (g: string[][], otra: string[][], cls: string) => {
    const trs = Array.from({ length: filas }, (_, r) => {
      const cols = Math.max(g[r]?.length ?? 0, otra[r]?.length ?? 0)
      const tds = Array.from({ length: cols }, (_, c) => {
        const val = g[r]?.[c]
        const dif = val !== otra[r]?.[c]
        if (val === undefined) return `<td class="miss">—</td>`
        return `<td class="${dif ? cls : ""}">${esc(val)}</td>`
      }).join("")
      return `<tr>${tds}</tr>`
    }).join("")
    return `<table class="grid">${trs}</table>`
  }
  return `<div class="grids">
    <div><h4>Esperado (${ge.length}×${ge[0]?.length ?? 0})</h4>${tabla(ge, gr, "exp")}</div>
    <div><h4>Recibido (${gr.length}×${gr[0]?.length ?? 0})</h4>${tabla(gr, ge, "rec")}</div>
  </div>`
}

function renderFallos(rows: Fila[]): string {
  const fallos = rows.filter((r) => r.Estado.includes("FALLÓ"))
  const cards = fallos.map((r) => {
    const d = diffCaracter(r.Esperado, r.Recibido)
    const esCsv = r.Esperado.includes("[BOM]") || r.Recibido.includes("[BOM]")
    const grid = esCsv ? gridCsv(r.Esperado, r.Recibido) : ""
    return `<section class="card">
      <h3>${esc(r.Grupo)}<br><small>${esc(r["Sub-test"])}</small></h3>
      <p class="ent"><b>Datos de entrada:</b><br><code>${esc(r["Datos de entrada"])}</code></p>
      <div class="diff">
        <div><span class="lbl">Esperado</span><code>${d.esperado}</code></div>
        <div><span class="lbl">Recibido</span><code>${d.recibido}</code></div>
      </div>
      ${grid ? `<p class="lbl">Vista en grilla (celda divergente resaltada):</p>${grid}` : ""}
      <p class="org">Origen: <code>${esc(r.Origen)}</code></p>
    </section>`
  }).join("\n")
  return `<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Detalle de fallos — QueHayPaHacer</title>
<style>
  :root{color-scheme:light dark}
  body{font:15px/1.5 system-ui,sans-serif;margin:0;padding:2rem;background:#f6f7f9;color:#1a1a1a}
  @media(prefers-color-scheme:dark){body{background:#15171a;color:#e8e8e8}}
  h1{font-size:1.4rem}h3{margin:.2rem 0 1rem;color:#dc2626}
  a{color:#6366f1}
  .card{background:#fff;border:1px solid #0001;border-left:4px solid #dc2626;border-radius:12px;padding:1.25rem 1.5rem;margin-bottom:1.5rem;box-shadow:0 1px 3px #0002}
  @media(prefers-color-scheme:dark){.card{background:#1d2025}}
  code{font:13px ui-monospace,monospace;background:#0000000a;padding:.15rem .4rem;border-radius:5px;white-space:pre-wrap;display:inline-block}
  @media(prefers-color-scheme:dark){code{background:#ffffff12}}
  .lbl{font-weight:600;font-size:.85rem;color:#888;display:block;margin:.75rem 0 .25rem}
  .diff{display:grid;gap:1rem;grid-template-columns:1fr 1fr}
  @media(max-width:640px){.diff{grid-template-columns:1fr}}
  mark.exp{background:#bbf7d0;color:#065f46;border-radius:3px}
  mark.rec{background:#fecaca;color:#7f1d1d;border-radius:3px}
  @media(prefers-color-scheme:dark){mark.exp{background:#14532d;color:#bbf7d0}mark.rec{background:#7f1d1d;color:#fecaca}}
  .grids{display:grid;gap:1.5rem;grid-template-columns:1fr 1fr;margin-top:.5rem}
  @media(max-width:640px){.grids{grid-template-columns:1fr}}
  h4{margin:.25rem 0;font-size:.85rem}
  table.grid{border-collapse:collapse}
  table.grid td{border:1px solid #8884;padding:.35rem .6rem;font:13px ui-monospace,monospace}
  table.grid td.exp{background:#bbf7d0;color:#065f46}table.grid td.rec{background:#fecaca;color:#7f1d1d}
  table.grid td.miss{background:#8882;color:#888}
  @media(prefers-color-scheme:dark){table.grid td.exp{background:#14532d;color:#bbf7d0}table.grid td.rec{background:#7f1d1d;color:#fecaca}}
</style></head><body>
<h1>Detalle de fallos — ${fallos.length} caso(s)</h1>
<p><a href="./reporte-pruebas.html">← Volver al reporte completo</a></p>
${fallos.length ? cards : "<p>✅ Sin fallos. Todas las pruebas pasaron.</p>"}
</body></html>`
}

after(() => {
  const dir = new URL("./", import.meta.url)
  const outMain = new URL("reporte-pruebas.html", dir)
  const outFail = new URL("reporte-fallos.html", dir)
  writeFileSync(outMain, renderHtml(tablero))
  writeFileSync(outFail, renderFallos(tablero))
  const ok = tablero.filter((r) => r.Estado.includes("PASÓ")).length
  const fail = tablero.length - ok
  console.log(`\n📋 Reporte: ${tablero.length} pruebas · ✅ ${ok} · ❌ ${fail}`)
  console.log(`   Completo:  ${pathToFileURL(outMain.pathname).href}`)
  if (fail > 0) console.log(`   Fallos:    ${pathToFileURL(outFail.pathname).href}`)
  console.log()
})
