import type { ISiteSuggestionRepository } from "@/domain/repository/siteSuggestion/ISiteSuggestionRepository";
import type { SitesService } from "./../sites/SitesService";
import { suggestionRuleError } from "@/domain/entities/siteSuggestion/SiteSuggestion";
import { parseSiteSuggestionInput } from "@/application/dto/siteSuggestion/SiteSuggestionDto";
import { LEGAL_VERSION } from "@/app/lib/legal/version";

export type SiteSuggestionResult = { success: true } | { success: false; error: string };

export class SiteSuggestionService {
  constructor(
    private readonly repository: ISiteSuggestionRepository,
    private readonly sitesService: SitesService,
  ) {}

  /** `uid` y `name` vienen del token de sesión, nunca del cliente. */
  async submit(user: { uid: string; name: string } | null, input: unknown): Promise<SiteSuggestionResult> {
    const parsed = parseSiteSuggestionInput(input);
    if (!parsed.success) return parsed;
    const { siteId, field, description, source } = parsed.output;

    const [site, pending] = await Promise.all([
      this.sitesService.getClaimSnapshot(siteId),
      user ? this.repository.pendingByAuthor(user.uid) : Promise.resolve([]),
    ]);
    const error = suggestionRuleError({ site, uid: user?.uid ?? null, pending, siteId, field });
    if (error || !site || !user) return { success: false, error: error ?? "No encontramos este lugar." };

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
    return { success: true };
  }

  async hasPending(uid: string, siteId: string): Promise<boolean> {
    return (await this.repository.pendingByAuthor(uid)).some((p) => p.siteId === siteId);
  }
}
