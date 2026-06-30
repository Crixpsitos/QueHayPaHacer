"use server";

import { createServerContainer } from "@/infraestructure/di/container";

type UploadVisibility = "public" | "private";

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
};

export async function generateUploadUrl({
  entityName,
  entityId,
  fileName,
  contentType,
  visibility = "public",
  subFolder,
  customMetadata,
}: GenerateUploadUrlOptions): Promise<UploadResult> {
  const { storageService } = createServerContainer();
  const bucketName = storageService.getBucketName;
  const resolvedSubFolder = subFolder ?? (contentType.startsWith("video/") ? "videos" : "images");
  const fullPath = `${visibility}/${entityName}/${entityId}/${resolvedSubFolder}/${fileName}-${crypto.randomUUID()}`;

  try {
    const signedUrl = await storageService.generateSignedUrl(
      fullPath,
      visibility === "public",
      contentType,
      customMetadata,
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