import { generateUploadUrl } from "@/presentation/shared/actions/generateUploadUrl";

export type UploadOptions = {
  fileName: string;
  contentType: string;
  isPublic?: boolean;
  subFolder?: string;
  customMetadata?: Record<string, string>;
  cacheControl?: string;
};

export type PreparedUpload = { uploadUrl: string; publicUrl: string; path: string };

/** Paso 1: pide la URL firmada. Devuelve `path`/`publicUrl` ANTES de subir, para poder guardar el item primero. */
export async function prepareUpload(
  file: File,
  entityName: string,
  entityId: string,
  options: UploadOptions = { fileName: "", contentType: "" },
): Promise<PreparedUpload> {
  const { uploadUrl, publicUrl, path } = await generateUploadUrl({
    entityName,
    entityId,
    fileName: options.fileName || file.name,
    contentType: options.contentType || file.type,
    visibility: options.isPublic ? "public" : "private",
    subFolder: options.subFolder,
    customMetadata: options.customMetadata,
    cacheControl: options.cacheControl,
  });

  if (!uploadUrl) {
    throw new Error("La URL de subida llegó vacía desde el servidor.");
  }
  return { uploadUrl, publicUrl, path };
}

/** Paso 2: sube el archivo a la URL firmada. */
export async function putToStorage(
  file: File,
  { uploadUrl }: PreparedUpload,
  options: UploadOptions = { fileName: "", contentType: "" },
) {
  try {
    const response = await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type,
        // solo x-goog-acl va firmado en la signed URL — no agregar headers extra (rompen el ACL/firma).
        // El cache-control de los archivos optimizados lo pone el Cloud Function.
        ...(options.isPublic && {
          "x-goog-acl": "public-read",
        }),
        // Cache-Control va firmado en la signed URL — debe enviarse aquí exacto o rompe la firma.
        ...(options.cacheControl && { "Cache-Control": options.cacheControl }),
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
  } catch (fetchError) {
    console.error("❌ Error al subir archivo a Google Storage:", fetchError);
    throw fetchError;
  }
}

export async function uploadToGoogleStorage(
  file: File,
  entityName: string,
  entityId: string,
  options: UploadOptions = { fileName: "", contentType: "" },
) {
  const prepared = await prepareUpload(file, entityName, entityId, options);
  await putToStorage(file, prepared, options);
  return { publicUrl: prepared.publicUrl, path: prepared.path };
}
