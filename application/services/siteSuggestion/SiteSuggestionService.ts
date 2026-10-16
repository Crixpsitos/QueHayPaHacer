import type { ISiteSuggestionRepository } from "@/domain/repository/siteSuggestion/ISiteSuggestionRepository";
import type { SitesService } from "./../sites/SitesService";
import { SUGGESTION_NOTE_MAX, suggestionRuleError, type SiteSuggestionItem } from "@/domain/entities/siteSuggestion/SiteSuggestion";
import { spamGuardError } from "@/domain/entities/spamGuard/spamGuard";
import { parseSiteSuggestionInput } from "@/application/dto/siteSuggestion/SiteSuggestionDto";
import { LEGAL_VERSION } from "@/app/lib/legal/version";

/** `siteAuthorId`/`siteName` (solo éxito): los usa la action para invalidar y avisar al autor; la action no los devuelve al cliente. */
export type SiteSuggestionResult =
  | { success: true; siteAuthorId?: string | null; siteName?: string }
  | { success: false; error: string };
/** `suggester` (solo éxito): a quién avisar de la resolución; la action no lo devuelve al cliente. */
export type ResolveSuggestionResult =
  | { success: true; suggester?: { uid: string; siteName: string; field: string } }
  | { success: false; error: string };

// ponytail: un autor con muchísimos sitios haría muchas queries; limitar/paginar si pasa de ~50.
const MAX_SITES_SCANNED = 50;

export class SiteSuggestionService {
  constructor(
    private readonly repository: ISiteSuggestionRepository,
    private readonly sitesService: SitesService,
  ) {}

  /** `uid` y `name` vienen del token de sesión, nunca del cliente. */
  async submit(user: { uid: string; name: string; accountCreatedAt?: number } | null, input: unknown): Promise<SiteSuggestionResult> {
    const parsed = parseSiteSuggestionInput(input);
    if (!parsed.success) return parsed;
    const { siteId, field, description, source } = parsed.output;

    const [site, pending] = await Promise.all([
      this.sitesService.getClaimSnapshot(siteId),
      user ? this.repository.pendingByAuthor(user.uid) : Promise.resolve([]),
    ]);
    const error = suggestionRuleError({ site, uid: user?.uid ?? null, pending, siteId, field });
    if (error || !site || !user) return { success: false, error: error ?? "No encontramos este lugar." };

    const spam = spamGuardError({
      kind: "suggestion",
      recent: await this.repository.recentByAuthor(user.uid),
      now: Date.now(),
      text: description,
      accountCreatedAt: user.accountCreatedAt,
    });
    if (spam) return { success: false, error: spam };

    // ponytail: check-then-add no es atómico; un doble clic simultáneo podría duplicar (el script lo ve igual).
    await this.repository.create({
      siteId,
      siteName: site.name,
      authorUid: user.uid,
      authorName: user.name,
      field,
      description,
      ...(source ? { source } : {}),
      declaration: true,
      termsVersion: LEGAL_VERSION,
      status: "pending",
    });
    return { success: true, siteAuthorId: site.authorId, siteName: site.name };
  }

  /** Sugerencias de los sitios del autor (pendientes primero, luego más recientes). Autoriza por `uid` de sesión. */
  async listForOwner(uid: string): Promise<SiteSuggestionItem[]> {
    const sites = (await this.sitesService.getMySites(uid)).slice(0, MAX_SITES_SCANNED);
    const all = (await Promise.all(sites.map((s) => this.repository.listBySite(s.id)))).flat();
    return all.sort(
      (a, b) => Number(b.status === "pending") - Number(a.status === "pending") || b.createdAt - a.createdAt,
    );
  }

  async countPendingForOwner(uid: string): Promise<number> {
    return (await this.listForOwner(uid)).filter((s) => s.status === "pending").length;
  }

  /** Aprobar = "la acepto y la voy a reflejar": solo marca estado, no edita el sitio. */
  async resolve(uid: string, id: string, decision: "approve" | "reject", note?: string): Promise<ResolveSuggestionResult> {
    if (decision !== "approve" && decision !== "reject") return { success: false, error: "Acción inválida." };
    const cleanNote = (typeof note === "string" ? note : "").trim();
    if (cleanNote.length > SUGGESTION_NOTE_MAX) return { success: false, error: `La nota admite máximo ${SUGGESTION_NOTE_MAX} caracteres.` };
    if (typeof id !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(id)) return { success: false, error: "Sugerencia inválida." };

    const s = await this.repository.getSiteIdAndStatus(id);
    if (!s) return { success: false, error: "No encontramos esta sugerencia." };
    if (!(await this.sitesService.isOwner(uid, s.siteId))) return { success: false, error: "No puedes resolver esta sugerencia." };
    const res = await this.repository.resolve(id, {
      status: decision === "approve" ? "applied" : "rejected",
      resolvedBy: uid,
      ...(cleanNote ? { note: cleanNote } : {}),
    });
    return res === "ok"
      ? { success: true, suggester: { uid: s.authorUid, siteName: s.siteName, field: s.field } }
      : { success: false, error: "Esta sugerencia ya fue resuelta." };
  }

  async hasPending(uid: string, siteId: string): Promise<boolean> {
    return (await this.repository.pendingByAuthor(uid)).some((p) => p.siteId === siteId);
  }
}
