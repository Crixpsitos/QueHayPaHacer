import * as v from "valibot";
import type { IProfessionalRequestRepository } from "@/domain/repository/professional/IProfessionalRequestRepository";
import type { IUserRepository } from "@/domain/repository/user/IUserRepository";
import type { ProfessionalRequest } from "@/domain/entities/professional/ProfessionalRequest";
import type { UserProfessionalStatus, UserAccountType } from "@/domain/entities/user/User";
import type { ProfessionalType } from "@/domain/entities/professional/ProfessionalRequest";
import {
  SubmitProfessionalRequestSchema,
  type SubmitProfessionalRequestDto,
} from "@/application/dto/professional/ProfessionalRequestDto";

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
      parsed.professionalType === "business" &&
      parsed.details.businessCategory === "otro" &&
      !parsed.details.businessDescription?.trim()
    ) {
      throw new Error("Describe tu negocio cuando la categoría es \"Otro\".");
    }

    if (
      parsed.professionalType === "organizer" &&
      parsed.details.organizerType === "empresa" &&
      !parsed.details.nit?.trim()
    ) {
      throw new Error("El NIT es requerido cuando organizas eventos como empresa.");
    }

    const normalizedUsername = parsed.username.trim().toLowerCase();
    if (normalizedUsername !== user.displayName) {
      const existing = await this.userRepository.findByUsername(normalizedUsername);
      if (existing && existing.uid !== user.uid) {
        throw new Error("Ese nombre de usuario ya está en uso.");
      }
    }

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
      details: parsed.details,
    });

    // Para negocios, mapsLink y socialLink viven dentro de details; los
    // promovemos a nivel de usuario para que la UI del perfil los muestre.
    const businessDetails =
      parsed.professionalType === "business" ? parsed.details : null;

    await this.userRepository.update(user.uid, {
      ...user,
      displayName: normalizedUsername,
      brandName: parsed.brandName.trim(),
      website: parsed.website?.trim() || undefined,
      mapsLink: businessDetails?.mapsLink?.trim() || undefined,
      socialLink: businessDetails?.socialLink?.trim() || undefined,
      professionalDetails: parsed.details,
      professionalStatus: "pending",
      updatedAt: new Date(),
    });

    return request;
  }
}
