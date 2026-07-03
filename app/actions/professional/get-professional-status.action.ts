"use server";

import { createServerContainer } from "@/infraestructure/di/container";
import type { ProfessionalStatusResult } from "@/application/services/professional/ProfessionalRequestService";

interface GetProfessionalStatusResult {
  success: boolean;
  data?: ProfessionalStatusResult;
  error?: string;
}

export async function getProfessionalStatusAction(uid: string): Promise<GetProfessionalStatusResult> {
  try {
    const { professionalRequestService } = createServerContainer();
    const data = await professionalRequestService.getStatus(uid);

    return { success: true, data };
  } catch (error) {
    console.error("[GET PROFESSIONAL STATUS ERROR]", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "No se pudo obtener el estado de la solicitud.",
    };
  }
}
