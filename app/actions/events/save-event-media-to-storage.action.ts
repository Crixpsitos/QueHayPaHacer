"use server";

import { createServerContainer } from "@/infraestructure/di/container";

type SaveEventMediaToStorageActionResult = | {
  success: true; 
  error?: never ;
  media: {
    id: string;
    url: string;
    path: string;
    type: "image" | "video"; 
  }[];
} | {
  success: false;
  error: string;
};

export async function saveEventMediaToStorage(
  formData: FormData,
): Promise<SaveEventMediaToStorageActionResult> {
  const { storageService } = createServerContainer();

  const id = formData.get("eventId") as string | null;

  const files = formData.getAll("media[]") as File[];

  if (!id) {
    return {
      success: false,
      error: "La imagen no puede ser cargada sin un evento asociado.",
    };
  }
  if (!files.length) {
    return { success: false, error: "Debes seleccionar al menos un archivo." };
  }

  try {
    const uploadResults = await storageService.uploadMany(files, {
      folder: `events/${id}/media`,
      visibility: "public",
    });

    const media = uploadResults.map((result, index) => {
      const file = files[index];

      const type = file.type.startsWith("video/")
        ? ("video" as const)
        : ("image" as const);

      return {
        id: crypto.randomUUID(),
        url: result.url,
        path: result.path,
        type: type,
      };
    });

    return {
      success: true,
      media,
    };
  } catch (error) {
    console.error("Error crítico subiendo multimedia de eventos:", error);

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }
    return {
      success: false,
      error: "Ocurrió un error inesperado al procesar los archivos.",
    };
  }
}
