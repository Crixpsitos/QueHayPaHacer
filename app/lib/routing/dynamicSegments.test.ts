import { test } from "node:test"
import assert from "node:assert/strict"
import { readdirSync, statSync } from "node:fs"
import { join } from "node:path"

// Next revienta al ARRANCAR (no al compilar) si dos carpetas hermanas dinámicas usan nombres distintos ([id] y [slug]).
function conflicts(dir: string, found: string[] = []): string[] {
  const subdirs = readdirSync(dir).filter((n) => statSync(join(dir, n)).isDirectory())
  const dyn = subdirs.filter((n) => /^\[[^\].]/.test(n) && !n.startsWith("[["))
  if (dyn.length > 1) found.push(`${dir}: ${dyn.join(" vs ")}`)
  for (const n of subdirs) conflicts(join(dir, n), found)
  return found
}

test("ninguna carpeta de app/ tiene dos segmentos dinámicos hermanos", () => {
  assert.deepEqual(conflicts(join(process.cwd(), "app")), [])
})
