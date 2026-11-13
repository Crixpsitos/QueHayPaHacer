import { prepareUpload, putToStorage } from "@/presentation/events/lib/upload/uploadToGoogleStorage";
import { resizeToJpeg } from "./resizeImage";

/** Sube una imagen de la carta (reducida a JPEG) al almacenamiento del sitio y devuelve su URL pública. */
export async function uploadCatalogImage(siteId: string, file: File): Promise<string> {
  const small = await resizeToJpeg(file);
  const opts = { fileName: small.name, contentType: small.type, isPublic: true, subFolder: "images" };
  const prepared = await prepareUpload(small, "sites", siteId, opts);
  await putToStorage(small, prepared, opts);
  return prepared.publicUrl;
}
