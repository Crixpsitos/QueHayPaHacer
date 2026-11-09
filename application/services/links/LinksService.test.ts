import test from "node:test";
import assert from "node:assert/strict";
import { LinksService, type LinksRepo, type LinkDoc } from "./LinksService";

function fakeRepo(over: Partial<LinksRepo> = {}) {
  const docs = new Map<string, LinkDoc>();
  const repo: LinksRepo = {
    create: async (l) => {
      if (docs.has(l.code)) throw Object.assign(new Error("exists"), { code: 6 });
      docs.set(l.code, { ...l, active: true });
    },
    findByCode: async (c) => docs.get(c) ?? null,
    recordClick: async () => {},
    countByOwner: async () => 0,
    listByOwner: async () => [],
    ...over,
  };
  return { repo, docs };
}
const input = { label: "Instagram de Nebraska", target: { type: "event" as const, id: "ev1" }, ownerUid: "u1" };

test("create: guarda el enlace con código válido", async () => {
  const { repo, docs } = fakeRepo();
  const link = await new LinksService(repo).create(input);
  assert.match(link.code, /^[A-Za-z0-9]{7}$/);
  assert.equal(docs.get(link.code)?.ownerUid, "u1");
});

test("create: si el código ya existe, reintenta con otro", async () => {
  const { repo, docs } = fakeRepo();
  const codes = ["AAAAAAA", "AAAAAAA", "BBBBBBB"];
  docs.set("AAAAAAA", { code: "AAAAAAA", label: "x", target: input.target, ownerUid: "z", active: true });
  const link = await new LinksService(repo, () => codes.shift()!).create(input);
  assert.equal(link.code, "BBBBBBB");
});

test("create: tras 5 choques falla en vez de ciclar", async () => {
  const { repo } = fakeRepo({ create: async () => { throw Object.assign(new Error("exists"), { code: 6 }); } });
  await assert.rejects(new LinksService(repo, () => "AAAAAAA").create(input), /código/i);
});

test("create: etiqueta vacía/larga o destino inválido se rechazan sin escribir", async () => {
  let writes = 0;
  const { repo } = fakeRepo({ create: async () => void writes++ });
  const s = new LinksService(repo);
  await assert.rejects(s.create({ ...input, label: "   " }));
  await assert.rejects(s.create({ ...input, label: "x".repeat(61) }));
  await assert.rejects(s.create({ ...input, target: { type: "url" as never, id: "x" } }));
  await assert.rejects(s.create({ ...input, target: { type: "event", id: "" } }));
  assert.equal(writes, 0);
});

test("resolve: lee una vez por minuto (caché) y devuelve null para inexistente/inactivo/código inválido", async () => {
  let reads = 0, t = 0;
  const { repo, docs } = fakeRepo({ findByCode: async (c) => (reads++, docs.get(c) ?? null) });
  docs.set("AAAAAAA", { code: "AAAAAAA", label: "x", target: input.target, ownerUid: "u", active: true });
  docs.set("OFFOFFO", { code: "OFFOFFO", label: "x", target: input.target, ownerUid: "u", active: false });
  const s = new LinksService(repo, undefined, () => t);
  assert.equal((await s.resolve("AAAAAAA"))?.target.id, "ev1");
  assert.equal((await s.resolve("AAAAAAA"))?.target.id, "ev1");
  assert.equal(reads, 1);
  t = 61_000;
  await s.resolve("AAAAAAA");
  assert.equal(reads, 2);
  assert.equal(await s.resolve("OFFOFFO"), null);
  assert.equal(await s.resolve("ZZZZZZZ"), null);
  const before = reads;
  assert.equal(await s.resolve("../x"), null);
  assert.equal(reads, before); // código inválido no gasta lectura
});
