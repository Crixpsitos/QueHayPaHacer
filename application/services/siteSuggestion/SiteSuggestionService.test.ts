import { test } from "node:test";
import assert from "node:assert/strict";
import { SiteSuggestionService } from "./SiteSuggestionService";

function make(opts: { owner?: string; status?: string } = {}) {
  const resolved: unknown[] = [];
  const repo = {
    getSiteIdAndStatus: async (id: string) => (id === "nope" ? null : { siteId: "s1", status: opts.status ?? "pending" }),
    resolve: async (_id: string, r: unknown) => {
      if ((opts.status ?? "pending") !== "pending") return "not_pending" as const;
      resolved.push(r);
      return "ok" as const;
    },
  };
  const sites = { isOwner: async (uid: string, id: string) => uid === (opts.owner ?? "owner") && id === "s1" };
  return { svc: new SiteSuggestionService(repo as never, sites as never), resolved };
}

test("solo el autor del sitio resuelve; registra resolvedBy y estado", async () => {
  const { svc, resolved } = make();
  assert.equal((await svc.resolve("intruso", "x1", "approve")).success, false);
  assert.equal(resolved.length, 0);
  assert.equal((await svc.resolve("owner", "x1", "approve", "  gracias ")).success, true);
  assert.deepEqual(resolved[0], { status: "applied", resolvedBy: "owner", note: "gracias" });
  await svc.resolve("owner", "x1", "reject");
  assert.deepEqual(resolved[1], { status: "rejected", resolvedBy: "owner" });
});

test("rechaza inexistente, ya resuelta, nota larga y decisión inválida", async () => {
  assert.equal((await make().svc.resolve("owner", "nope", "approve")).success, false);
  assert.equal((await make({ status: "applied" }).svc.resolve("owner", "x1", "approve")).success, false);
  assert.equal((await make().svc.resolve("owner", "x1", "approve", "x".repeat(201))).success, false);
  assert.equal((await make().svc.resolve("owner", "x1", "hack" as never)).success, false);
});
