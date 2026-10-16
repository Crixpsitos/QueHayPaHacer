import type { ISiteClaimRepository } from "@/domain/repository/siteClaim/ISiteClaimRepository";
import type { SitesService } from "./../sites/SitesService";
import { claimRuleError } from "@/domain/entities/siteClaim/SiteClaim";
import { parseSiteClaimInput } from "@/application/dto/siteClaim/SiteClaimDto";
import { spamGuardError } from "@/domain/entities/spamGuard/spamGuard";
import { LEGAL_VERSION } from "@/app/lib/legal/version";

export type SiteClaimResult = { success: true } | { success: false; error: string };

export class SiteClaimService {
  constructor(
    private readonly repository: ISiteClaimRepository,
    private readonly sitesService: SitesService,
  ) {}

  /** `uid`, `name` y `email` vienen del token de sesión, nunca del cliente. */
  async submit(user: { uid: string; name: string; email: string; accountCreatedAt?: number }, input: unknown): Promise<SiteClaimResult> {
    const parsed = parseSiteClaimInput(input);
    if (!parsed.success) return parsed;
    const { siteId, relation, contactPhone, evidence } = parsed.output;

    const [site, pending] = await Promise.all([
      this.sitesService.getClaimSnapshot(siteId),
      this.repository.pendingSiteIdsByClaimant(user.uid),
    ]);
    const error = claimRuleError({
      site,
      uid: user.uid,
      hasPendingForSite: pending.includes(siteId),
      pendingCount: pending.length,
    });
    if (error || !site) return { success: false, error: error ?? "No encontramos este lugar." };

    const spam = spamGuardError({
      kind: "claim",
      recent: await this.repository.recentByClaimant(user.uid),
      now: Date.now(),
      accountCreatedAt: user.accountCreatedAt,
    });
    if (spam) return { success: false, error: spam };

    // ponytail: check-then-add no es atómico; un doble clic simultáneo podría duplicar (el script lo ve igual).
    await this.repository.create({
      siteId,
      siteName: site.name,
      claimantUid: user.uid,
      claimantName: user.name,
      relation,
      ...(contactPhone ? { contactPhone } : {}),
      contactEmail: user.email,
      evidence,
      declaration: true,
      termsVersion: LEGAL_VERSION,
      status: "pending",
    });
    return { success: true };
  }

  async hasPending(uid: string, siteId: string): Promise<boolean> {
    return (await this.repository.pendingSiteIdsByClaimant(uid)).includes(siteId);
  }
}
