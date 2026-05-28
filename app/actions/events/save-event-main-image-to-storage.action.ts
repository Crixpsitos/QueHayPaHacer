"use server";

import sizeOf from "image-size";
import { createServerContainer } from "@/infraestructure/di/container";

type SaveEventMainImageToStorageActionResult = {
  success: true;
  url: string;
  path: string;
  width: number;
  height: number;
  error?: never;
} | {
  success: false;
  error: string;
};


export async function saveEventMainImageToStorage(
  formData: FormData,
): Promise<SaveEventMainImageToStorageActionResult> {
  const { storageService } = createServerContainer();

  const id = formData.get("eventId") as string | null;
  const file: File | undefined = formData.get("file") as File | undefined;

  if (!id) return { success: false, error: "La imagen no puede ser cargada sin un evento asociado." };
  if (!file) return { success: false, error: "Debes seleccionar una imagen." };
  if (file.size > 1024 * 1024 * 20) {
    return { success: false, error: "La imagen es demasiado grande. Menor a 20MB por favor." };
  }

  try {
    const uploadPromise = storageService.upload(file, {
      folder: `events/${id}/images`,
      fileName: `main-image-${file.name}`,
      visibility: "public",
      metadata: {
        contentType: file.type,
        customMetadata: { eventId: id },
      },
    });

    const dimensionsPromise = getServerImageDimensions(file);

    const [storageResult, dimensions] = await Promise.all([
      uploadPromise,
      dimensionsPromise,
    ]);
    return {
      success: true,
      url: storageResult.url,
      path: storageResult.path,
      width: dimensions.width,
      height: dimensions.height,
    };

  } catch (error) {

    if (error instanceof Error) {
      console.error("Error al guardar la imagen:", error.message);
      return {
        success: false,
        error: error.message,
      };
    } else {
        console.error("Error al guardar la imagen:", error);
        return {
            success: false,
            error: "Ocurrió un error al procesar la imagen en el servidor.",
        }
    }

  }
}