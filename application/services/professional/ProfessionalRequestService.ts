import * as v from "valibot";
import type { IProfessionalRequestRepository } from "@/domain/repository/professional/IProfessionalRequestRepository";
import type { IUserRepository } from "@/domain/repository/user/IUserRepository";
import type { ProfessionalRequest, BusinessDetails, GovernmentDetails, ProfessionalRequestDetails } from "@/domain/entities/professional/ProfessionalRequest";
import type { UserProfessionalStatus, UserAccountType } from "@/domain/entities/user/User";
import type { ProfessionalType } from "@/domain/entities/professional/ProfessionalRequest";
import {
  SubmitProfessionalRequestSchema,
  type SubmitProfessionalRequestDto,
} from "@/application/dto/professional/ProfessionalRequestDto";

// Solo permite hostnames conocidos de Google Maps para evitar SSRF.
const GOOGLE_MAPS_HOSTS = new Set(["maps.app.goo.gl", "goo.gl", "maps.google.com", "www.google.com", "google.com"]);

async function resolveGoogleMapsCoords(rawUrl: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const parsed = new URL(rawUrl);
    if (!GOOGLE_MAPS_HOSTS.has(parsed.hostname)) return null;
    if ((parsed.hostname === "www.google.com" || parsed.hostname === "google.com") &&
        !parsed.pathname.startsWith("/maps")) return null;
    const res = await fetch(rawUrl, { redirect: "follow" });
    const match = res.url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (!match) return null;
    return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
  } catch {
    return null;
  }
}

export interface ProfessionalStatusResult {
  accountType: UserAccountType;
  professionalStatus: UserProfessionalStatus;
  professionalType: ProfessionalType | null;
  latestRequest: ProfessionalRequest | null;
}

export class ProfessionalRequestService {
  constructor(
    private readonly requestRepository: IProfessionalRequestRepository,
    private readonly userRepository: IUserRepository,
  ) {}

  async getStatus(uid: string): Promise<ProfessionalStatusResult> {
    const user = await this.userRepository.findById(uid);
    if (!user) {
      throw new Error("Usuario no encontrado");
    }

    const latestRequest = await this.requestRepository.findLatestByUid(uid);

    return {
      accountType: user.accountType,
      professionalStatus: user.professionalStatus,
      professionalType: user.professionalType,
      latestRequest,
    };
  }

  async submitRequest(input: SubmitProfessionalRequestDto): Promise<ProfessionalRequest> {
    const parsed = v.parse(SubmitProfessionalRequestSchema, input);

    const user = await this.userRepository.findById(parsed.uid);
    if (!user) {
      throw new Error("Usuario no encontrado");
    }

    if (user.professionalStatus === "pending") {
      throw new Error("Ya tienes una solicitud en revisión.");
    }

    if (user.professionalStatus === "approved") {
      throw new Error("Tu cuenta ya es profesional.");
    }

    if (
      parsed.professionalType === "organizer" &&
      parsed.details.organizerType === "organization" &&
      !parsed.details.nit?.trim()
    ) {
      throw new Error("El NIT es requerido cuando organizas eventos como empresa u organización.");
    }

    const normalizedUsername = parsed.username.trim().toLowerCase();

    // Auto-resolve collisions para todos los tipos — suffix strategy: base → base1 → base2 …
    const finalUsername = await this.resolveAvailableUsername(normalizedUsername, user.uid);

    let previousRequestId: string | null = null;
    let reapplyReason: string | null = null;

    if (user.professionalStatus === "rejected") {
      const latest = await this.requestRepository.findLatestByUid(user.uid);
      previousRequestId = latest?.id ?? null;
      reapplyReason = parsed.reapplyReason?.trim() || null;

      if (!reapplyReason) {
        throw new Error("Debes explicar qué corregiste respecto a tu solicitud anterior.");
      }
    }

    const businessDetails =
      parsed.professionalType === "business" ? (parsed.details as BusinessDetails) : null;
    const governmentDetails =
      parsed.professionalType === "government" ? (parsed.details as GovernmentDetails) : null;

    // locationLat/locationLng son server-computed, no están en el schema de valibot
    let enrichedDetails: ProfessionalRequestDetails = parsed.details as ProfessionalRequestDetails;
    if (businessDetails?.mapsLink) {
      const coords = await resolveGoogleMapsCoords(businessDetails.mapsLink);
      const withCoords: BusinessDetails = {
        ...businessDetails,
        locationLat: coords?.lat ?? null,
        locationLng: coords?.lng ?? null,
      };
      enrichedDetails = withCoords;
    }

    const request = await this.requestRepository.create({
      uid: user.uid,
      status: "pending",
      submittedAt: new Date(),
      reviewedAt: null,
      rejectionReason: null,
      professionalType: parsed.professionalType,
      brandName: parsed.brandName.trim(),
      description: parsed.description.trim(),
      phone: parsed.phone.trim(),
      website: parsed.website?.trim() || null,
      previousRequestId,
      reapplyReason,
      details: enrichedDetails,
    });

    await this.userRepository.update(user.uid, {
      ...user,
      displayName: finalUsername,
      isUsernameCustomized: false,
      brandName: parsed.brandName.trim(),
      website: parsed.website?.trim() || undefined,
      professionalDescription: parsed.description.trim(),
      // mapsLink se promueve al perfil para que el ProfileHeader lo muestre
      mapsLink: businessDetails?.mapsLink?.trim() || governmentDetails?.mapsLink?.trim() || undefined,
      professionalDetails: parsed.details as ProfessionalRequestDetails,
      professionalStatus: "pending",
      updatedAt: new Date(),
    });

    return request;
  }

  /** Finds the first available username starting from `base`, appending 1, 2 … on collision. */
  private async resolveAvailableUsername(base: string, currentUid: string): Promise<string> {
    const existing = await this.userRepository.findByUsername(base);
    if (!existing || existing.uid === currentUid) return base;
    for (let i = 1; i <= 99; i++) {
      const candidate = `${base.slice(0, 28)}${i}`;
      const taken = await this.userRepository.findByUsername(candidate);
      if (!taken) return candidate;
    }
    return `${base.slice(0, 26)}${Date.now().toString(36).slice(-4)}`;
  }
}
