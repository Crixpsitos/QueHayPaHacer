"use server";

import { createServerContainer } from "@/infraestructure/di/container";
import { revalidateTag } from "next/cache";
import type { SubmitProfessionalRequestDto } from "@/application/dto/professional/ProfessionalRequestDto";

interface SubmitProfessionalRequestResult {
  success: boolean;
  error?: string;
}

export async function submitProfessionalRequestAction(
  input: SubmitProfessionalRequestDto,
): Promise<SubmitProfessionalRequestResult> {
  try {
    const { professionalRequestService } = createServerContainer();

    await professionalRequestService.submitRequest(input);

    revalidateTag(`user-profile-${input.uid}`, "max");

    return { success: true };
  } catch (error) {
    console.error("[SUBMIT PROFESSIONAL REQUEST ERROR]", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "No se pudo enviar la solicitud. Intenta de nuevo.",
    };
  }
}
