import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

// Guardia de regresión: en sesiones el item de media debe guardarse en Firestore ANTES de subir el archivo (si no, el
// CF corre antes y lo deja "procesando" para siempre) y el guardado no debe pisar lo que el CF ya terminó.
const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), "utf8")
const form = read("./SessionForm.tsx")

test("SessionForm sube la galería con el orquestador persistir-primero", () => {
  assert.ok(form.includes("uploadMediaPersistFirst("))
})

test("SessionForm ya no sube con uploadToGoogleStorage (que subía antes de guardar)", () => {
  assert.ok(!form.includes("uploadToGoogleStorage("))
})

test("la portada guarda 'processing' antes de hacer el PUT", () => {
  const save = form.indexOf('status: "processing" }, { shouldDirty: true }')
  const put = form.indexOf("putToStorage(file, prepared, uploadOptions)")
  assert.ok(save !== -1 && put !== -1 && save < put)
})

test("revisa el resultado de saveDraftSessionAction (devuelve {success:false}, no lanza)", () => {
  assert.ok(form.includes("!saved.success"))
})

test("el repositorio de sesiones fusiona en transacción para no pisar el ready del CF", () => {
  const repo = read("../../../../infraestructure/firebase/repositories/events/EventSessionFirebaseRepository.ts")
  assert.ok(repo.includes("runTransaction") && repo.includes("mergeMediaStatus("))
})
