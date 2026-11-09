/**
 * T0 analytics-v2: línea base de contadores. SOLO LECTURA (REST + token de gcloud).
 * Uso: pnpm exec tsx scripts/analytics-baseline.ts --project quehaypahacer-develop|quehaypahacer-prod
 * Guarda JSON fechado en ~/.cache/qhpa-qa/baselines/.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { BASELINE_METRICS, summarizeBaseline, type BaselineDoc } from "../domain/entities/analytics/baseline";

const i = process.argv.indexOf("--project");
const project = i >= 0 ? process.argv[i + 1] : undefined;
if (!project) throw new Error("Uso: --project <id del proyecto>");
const DB = "quehaypahacer-db";
const base = `https://firestore.googleapis.com/v1/projects/${project}/databases/${DB}/documents`;
const token = execFileSync("gcloud", ["auth", "print-access-token"], { encoding: "utf8" }).trim();

async function call(url: string, init?: RequestInit) {
  const r = await fetch(url, { ...init, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } });
  if (!r.ok) throw new Error(`${r.status} ${url}: ${(await r.text()).slice(0, 300)}`);
  return r.json();
}

const metricOf = (f: any) => (f?.integerValue !== undefined ? Number(f.integerValue) : f?.doubleValue);

async function readCollection(col: string): Promise<BaselineDoc[]> {
  const out: BaselineDoc[] = [];
  let pageToken = "";
  do {
    const q = new URLSearchParams({ pageSize: "300", "mask.fieldPaths": "analytics" });
    if (pageToken) q.set("pageToken", pageToken);
    const j = await call(`${base}/${col}?${q}`);
    for (const d of j.documents ?? []) {
      const f = d.fields?.analytics?.mapValue?.fields ?? {};
      const analytics: BaselineDoc["analytics"] = {};
      for (const m of BASELINE_METRICS) if (f[m]) analytics[m] = metricOf(f[m]);
      out.push({ id: d.name.split("/").pop(), analytics });
    }
    pageToken = j.nextPageToken ?? "";
  } while (pageToken);
  return out;
}

/** ids de `col` que tienen al menos un doc en la subcolección `stats` (collection group). */
async function idsWithStats(col: string): Promise<Set<string>> {
  const ids = new Set<string>();
  let last: string | undefined;
  for (;;) {
    const structuredQuery: any = {
      from: [{ collectionId: "stats", allDescendants: true }],
      select: { fields: [{ fieldPath: "__name__" }] },
      orderBy: [{ field: { fieldPath: "__name__" }, direction: "ASCENDING" }],
      limit: 1000,
    };
    if (last) structuredQuery.startAt = { values: [{ referenceValue: last }], before: false };
    const rows = (await call(`${base}:runQuery`, { method: "POST", body: JSON.stringify({ structuredQuery }) })).filter((r: any) => r.document);
    for (const r of rows) {
      const parts: string[] = r.document.name.split("/documents/")[1].split("/");
      if (parts[0] === col) ids.add(parts[1]);
    }
    if (rows.length < 1000) return ids;
    last = rows[rows.length - 1].document.name;
  }
}

async function main() {
  const result: Record<string, unknown> = { project, takenAt: new Date().toISOString() };
  for (const col of ["events", "sites"]) {
    const summary = summarizeBaseline(await readCollection(col), await idsWithStats(col));
    result[col] = summary;
  }
  console.log(JSON.stringify(result, null, 2));
  const dir = join(homedir(), ".cache/qhpa-qa/baselines");
  mkdirSync(dir, { recursive: true });
  const file = join(dir, `${project}-${new Date().toISOString().slice(0, 10)}.json`);
  writeFileSync(file, JSON.stringify(result, null, 2));
  console.log(`guardado: ${file}`);
}
main();
