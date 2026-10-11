"use server";

import { getSessionUid } from "@/app/actions/_session";

import { createServerContainer } from "@/infraestructure/di/container";
import { getFirebaseAdminAuth } from "@/infraestructure/firebase/config/admin/firebase";
import { generateUsername } from "@/app/lib/utils/generateUsername";
import { updateTag } from "next/cache";
import * as v from "valibot";
import type { SocialLinkEntry } from "@/domain/entities/user/User";

interface UpdateProfileInput {
  uid: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  phoneNumber?: string;
  website?: string;
  socialLinks?: SocialLinkEntry[];
  isUsernameCustomized?: boolean;
}

interface UpdateProfileResult {
  success: boolean;
  error?: string;
}

const PROFILE_ERROR_MESSAGES: Record<string, string> = {
  "auth/phone-number-already-exists": "Ese numero de telefono ya esta en uso por otra cuenta.",
  "auth/invalid-phone-number": "El telefono no tiene un formato valido. Usa 10 digitos de Colombia.",
  "auth/invalid-display-name": "El nombre de usuario no es valido.",
  "auth/user-not-found": "No encontramos tu usuario para actualizar el perfil.",
};

function normalizePhoneToColombia(phoneNumber?: string): string | undefined {
  const rawPhone = phoneNumber?.trim() ?? "";
  if (!rawPhone) {
    return undefined;
  }

  const digits = rawPhone.replace(/\D/g, "");

  if (!digits) {
    return undefined;
  }

  if (digits === "57") {
    return undefined;
  }

  if (digits.startsWith("57")) {
    return `+${digits}`;
  }

  return `+57${digits}`;
}

function resolveFirebaseErrorMessage(error: unknown): string {
  const codeFromError =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code?: string }).code)
      : "";

  const codeFromErrorInfo =
    typeof error === "object" && error !== null && "errorInfo" in error
      ? String(((error as { errorInfo?: { code?: string } }).errorInfo?.code ?? ""))
      : "";

  const code = codeFromError || codeFromErrorInfo;
  if (code && PROFILE_ERROR_MESSAGES[code]) {
    return PROFILE_ERROR_MESSAGES[code];
  }

  return "No se pudo actualizar el perfil. Intenta nuevamente.";
}

export async function updateProfileAction(input: UpdateProfileInput): Promise<UpdateProfileResult> {
  try {
    if (!input.uid || (await getSessionUid()) !== input.uid) return { success: false, error: "No autorizado." };
    const { userService } = createServerContainer();

    // Obtener usuario actual DESDE LA BD para comparar correctamente
    const currentUserDB = await userService.getUserById(input.uid);
    
    if (!currentUserDB) {
      return {
        success: false,
        error: "No encontramos tu usuario para actualizar el perfil.",
      };
    }

    // Obtener el número actual desde la BD (no desde Firebase Auth)
    const currentPhoneFromDB = currentUserDB.phoneNumber || "";
    
    const normalizedNewPhone = normalizePhoneToColombia(input.phoneNumber);
    const normalizedCurrentPhone = normalizePhoneToColombia(currentPhoneFromDB);

    if (normalizedNewPhone && !/^\+57\d{10}$/.test(normalizedNewPhone)) {
      return {
        success: false,
        error: "El telefono debe tener 10 digitos para Colombia.",
      };
    }

    const username = generateUsername(input.username?.trim() ?? "");
    const firstName = input.firstName?.trim();
    const lastName = input.lastName?.trim();
    const bio = input.bio?.trim() ?? "";

    if (!username || username.length < 3) {
      return {
        success: false,
        error: "El username debe tener al menos 3 caracteres.",
      };
    }

    const usernameChanged = username !== currentUserDB.displayName;
    const authPayload: { displayName?: string; phoneNumber?: string | null } = {};

    // Solo actualizar displayName si realmente cambió (BD = fuente de verdad)
    if (usernameChanged) {
      authPayload.displayName = username;
    }
    
    // CRÍTICO: Comparar números obtenidos DE LA BD (fuente de verdad)
    // Si el número nuevo (normalizado) es diferente al actual (también normalizado), actualizar
    if (normalizedNewPhone && normalizedNewPhone !== normalizedCurrentPhone) {
      // El número cambió a uno diferente
      authPayload.phoneNumber = normalizedNewPhone;
    } else if (!normalizedNewPhone && normalizedCurrentPhone) {
      // El usuario quiere borrar el número (envió vacío pero tenía uno)
      authPayload.phoneNumber = null;
    }
    // Si son iguales, no hacer nada

    const dbPayload: {
      displayName?: string;
      firstName?: string;
      lastName?: string;
      bio?: string;
      phoneNumber?: string;
      website?: string;
      socialLinks?: SocialLinkEntry[];
      isUsernameCustomized?: boolean;
    } = {};

    // Solo incluir campos que realmente cambiaron
    if (input.bio !== undefined) {
      dbPayload.bio = bio;
    }
    if (usernameChanged) {
      dbPayload.displayName = username;
    }
    if (firstName) {
      dbPayload.firstName = firstName;
    }
    if (lastName) {
      dbPayload.lastName = lastName;
    }
    // Usar la misma lógica comparando con la BD
    if (normalizedNewPhone && normalizedNewPhone !== normalizedCurrentPhone) {
      dbPayload.phoneNumber = normalizedNewPhone;
    } else if (!normalizedNewPhone && normalizedCurrentPhone) {
      dbPayload.phoneNumber = "";
    }

    if (input.website !== undefined) dbPayload.website = input.website;
    if (input.socialLinks !== undefined) dbPayload.socialLinks = input.socialLinks;
    if (input.isUsernameCustomized !== undefined) dbPayload.isUsernameCustomized = input.isUsernameCustomized;

    // Auth primero: si falla (p. ej. teléfono en uso) la BD queda intacta.
    // Si luego falla la BD, se revierte Auth a los valores previos.
    const auth = getFirebaseAdminAuth();
    const hasAuthChanges = Object.keys(authPayload).length > 0;
    const previousAuth = hasAuthChanges ? await auth.getUser(input.uid) : null;
    if (hasAuthChanges) await auth.updateUser(input.uid, authPayload);

    try {
      await userService.updateUser(input.uid, dbPayload);
    } catch (dbError) {
      if (previousAuth) {
        await auth
          .updateUser(input.uid, {
            ...("displayName" in authPayload && { displayName: previousAuth.displayName ?? null }),
            ...("phoneNumber" in authPayload && { phoneNumber: previousAuth.phoneNumber ?? null }),
          })
          .catch((e) => console.error("Error revirtiendo Auth tras fallo de BD:", e));
      }
      throw dbError;
    }

    updateTag(`user-profile-${input.uid}`);

    return { success: true };
  } catch (error) {
    console.error("Error updating profile:", error);
    if (error instanceof Error && error.message === "Username already in use") {
      return { success: false, error: "Ese username ya está en uso. Elige otro." };
    }
    if (error instanceof v.ValiError) {
      return { success: false, error: "Revisa el sitio web y los enlaces: deben ser URLs http(s) válidas." };
    }
    return {
      success: false,
      error: resolveFirebaseErrorMessage(error),
    };
  }
}
