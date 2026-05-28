import { generateUploadUrl } from "@/presentation/shared/actions/generateUploadUrl";

export async function uploadToGoogleStorage(file: File, entityName: string, entityId: string) {
  const { uploadUrl, publicUrl, path } = await generateUploadUrl({
    entityName,
    entityId,
    fileName: file.name,
    contentType: file.type,
  });

  if (!uploadUrl) {
    throw new Error("La URL de subida llegó vacía desde el servidor.");
  }

  try {
    const response = await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type },
    });

    if (!response.ok) {
      throw new Error(`Google respondió con status: ${response.status}`);
    }

    return { publicUrl, path };
  } catch (fetchError) {
    console.error("❌ Error al subir archivo a Google Storage:", fetchError);
    throw fetchError;
  }
}