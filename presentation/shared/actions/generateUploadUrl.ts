"use server";

import { getSessionUid } from "@/app/actions/_session";

import { createServerContainer } from "@/infraestructure/di/container";

type UploadVisibility = "public" | "private";

// Callers reales: profile/support (carpeta del propio uid), events/sessions/sites (ids pueden ser borradores aún sin doc).
const OWN_UID_ENTITIES = new Set(["profile", "support"]);
const ENTITIES = new Set([...OWN_UID_ENTITIES, "events", "sessions", "sites"]);
const SUBFOLDERS = new Set(["", "images", "videos", "avatar", "banner", "media", "attachments"]);
// svg excluido: bucket público y puede ejecutar scripts.
const CONTENT_TYPE = /^(image\/(?!svg)[a-z0-9.+-]+|video\/[a-z0-9.+-]+)$/;
const SEGMENT = /^[A-Za-z0-9_-]{1,128}$/;

/** Nombre de archivo seguro como segmento de ruta: sin "/", ".." ni caracteres raros. */
const sanitizeFileName = (name: string) =>
  name.replace(/[^A-Za-z0-9._-]+/g, "_").replace(/\.{2,}/g, ".").slice(0, 100) || "file";

type UploadResult = {
  uploadUrl: string;
  publicUrl: string;
  path: string;
};

type GenerateUploadUrlOptions = {
  entityName: string;
  entityId: string;
  fileName: string;
  contentType: string;
  visibility?: UploadVisibility;
  subFolder?: string;
  customMetadata?: Record<string, string>;
  cacheControl?: string;
};

export async function generateUploadUrl({
  entityName,
  entityId,
  fileName,
  contentType,
  visibility = "public",
  subFolder,
  customMetadata,
  cacheControl,
}: GenerateUploadUrlOptions): Promise<UploadResult> {
  // URLs firmadas de escritura al bucket: solo con sesión.
  const uid = await getSessionUid();
  if (!uid) throw new Error("No autenticado");
  if (!ENTITIES.has(entityName) || !SEGMENT.test(entityId)) throw new Error("Destino de subida no permitido");
  if (OWN_UID_ENTITIES.has(entityName) && entityId !== uid) throw new Error("Destino de subida no permitido");
  if (!CONTENT_TYPE.test(contentType)) throw new Error("Tipo de archivo no permitido");
  if (subFolder !== undefined && !SUBFOLDERS.has(subFolder)) throw new Error("Carpeta no permitida");
  if (customMetadata && Object.keys(customMetadata).some((k) => !/^[a-z0-9-]{1,64}$/.test(k))) {
    throw new Error("Metadatos no permitidos");
  }
  // ponytail: sin tope de tamaño — StorageService.generateSignedUrl no deja pasar x-goog-content-length-range.
  const { storageService } = createServerContainer();
  const bucketName = storageService.getBucketName;
  const resolvedSubFolder = subFolder ?? (contentType.startsWith("video/") ? "videos" : "images");
  // filter(Boolean) colapsa subFolder="" → sin doble slash (public/sessions/{id}/{file})
  const fullPath = [visibility, entityName, entityId, resolvedSubFolder, `${sanitizeFileName(fileName)}-${crypto.randomUUID()}`]
    .filter(Boolean)
    .join("/");

  try {
    const signedUrl = await storageService.generateSignedUrl(
      fullPath,
      visibility === "public",
      contentType,
      customMetadata,
      cacheControl,
    );

    return {
      uploadUrl: signedUrl,
      publicUrl: visibility === "public"
        ? `https://storage.googleapis.com/${bucketName}/${fullPath}`
        : "",   // los archivos privados no tienen URL pública
      path: fullPath,
    };
  } catch (error) {
    console.error("Error al generar URL de subida:", error);
    return {
      uploadUrl: "",
      publicUrl: "",
      path: "",
    };
  }
}