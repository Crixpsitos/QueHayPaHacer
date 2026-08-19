"use server";

import { getTokens } from "next-firebase-auth-edge";
import { cookies } from "next/headers";
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase";
import { createServerContainer } from "@/infraestructure/di/container";

export interface ContactActionInput {
  email: string;
  phoneNumber?: string;
  message: string;
  contactReason: string;
}

export type ContactActionResult =
  | { success: true }
  | { success: false; error: string };

export async function sendContactAction(
  input: ContactActionInput,
): Promise<ContactActionResult> {
  const tokens = await getTokens(await cookies(), authConfig);
  const uid = tokens?.decodedToken?.uid ?? null;

  const { contactService } = createServerContainer();

  try {
    await contactService.submit({
      email: input.email,
      phoneNumber: input.phoneNumber,
      message: input.message,
      contactReason: input.contactReason,
      uid,
    });

    return { success: true };
  } catch (e) {
    console.error("[sendContact]", e);
    return {
      success: false,
      error:
        e instanceof Error
          ? e.message
          : "No se pudo enviar el mensaje. Intenta nuevamente.",
    };
  }
}
