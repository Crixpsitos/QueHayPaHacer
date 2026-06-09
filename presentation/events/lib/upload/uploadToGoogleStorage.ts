import { generateUploadUrl } from "@/presentation/shared/actions/generateUploadUrl";

export async function uploadToGoogleStorage(
  file: File,
  entityName: string,
  entityId: string,
  options: {
    fileName: string;
    contentType: string;
    isPublic?: boolean;
    customMetadata?: Record<string, string>;
  } = {
    fileName: "",
    contentType: "",
  },
) {

  console.log("🚀 Subiendo archivo a Google Storage...", options.isPublic);

  const { uploadUrl, publicUrl, path } = await generateUploadUrl({
    entityName,
    entityId,
    fileName: options.fileName || file.name,
    contentType: options.contentType || file.type,
    visibility: options.isPublic ? "public" : "private",
    customMetadata: options.customMetadata,
  });

  if (!uploadUrl) {
    throw new Error("La URL de subida llegó vacía desde el servidor.");
  }

  try {
    const response = await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type,
        ...(options.isPublic && { "x-goog-acl": "public-read" }),
        ...Object.fromEntries(
          Object.entries(options.customMetadata ?? {}).map(([key, value]) => [
            `x-goog-meta-${key}`,
            value,
          ]),
        ),
      },
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
