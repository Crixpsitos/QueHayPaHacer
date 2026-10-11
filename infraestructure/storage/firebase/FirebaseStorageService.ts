/* eslint-disable @typescript-eslint/no-explicit-any */
import { IStorageService } from "@/domain/services/storage/IStorageService";
import { getFirebaseStorage } from "@/infraestructure/firebase/config/admin/firebase";

export class StorageService implements IStorageService {
  private storage = getFirebaseStorage();
  private bucket = this.storage.bucket();

  async upload(
    file: File,
    options: {
      folder?: string;
      fileName?: string;
      visibility?: "public" | "private";
      metadata?: {
        contentType?: string;
        customMetadata?: {
          [key: string]: string;
        };
      };
    } = {},
  ): Promise<{ url: string; path: string }> {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileName = options?.fileName ?? `${crypto.randomUUID()}-${file.name}`;
    const fullPath = `${options?.folder ?? "uploads"}/${fileName}`;
    const storageRef = this.bucket.file(fullPath);

    const isPublic = options?.visibility === "public";

    await storageRef.save(buffer, {
      resumable: false,
      public: isPublic,
      metadata: {
        contentType: options?.metadata?.contentType ?? file.type,
        metadata: {
          ...options?.metadata?.customMetadata,
        },
      },
    });

    if (isPublic) {
      return {
        url: `https://storage.googleapis.com/${this.bucket.name}/${fullPath}`,
        path: fullPath,
      };
    }

    const [signedUrl] = await storageRef.getSignedUrl({
      action: "read",
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    });

    return {
      url: signedUrl,
      path: fullPath,
    };
  }

  async generateSignedUrl(
  path: string,
  isPublic: boolean,
  contentType?: string,
  customMetadata?: Record<string, string>,
  cacheControl?: string,
): Promise<string> {
  try {
    const fileRef = this.bucket.file(path);
    const metadataHeaders = customMetadata
      ? Object.fromEntries(
          Object.entries(customMetadata).map(([key, value]) => [
            `x-goog-meta-${key}`,
            value,
          ]),
        )
      : {};

    const extensionHeaders = {
      ...(isPublic && { "x-goog-acl": "public-read" }),
      ...(cacheControl && { "cache-control": cacheControl }),
      ...metadataHeaders,
    };

    const [signedUrl] = await fileRef.getSignedUrl({
      version: "v4",
      action: "write",
      expires: Date.now() + 15 * 60 * 1000,
      ...(contentType && {contentType}),
      ...(Object.keys(extensionHeaders).length > 0 && { extensionHeaders }),
    });

    return signedUrl;
  } catch (error: any) {
    throw error;
  }
}

  async delete(path: string): Promise<void> {
    try {
      const fileRef = this.bucket.file(path);
      await fileRef.delete();
    } catch (error: any) {
      if (error.code !== 404) {
        throw error;
      }
    }
  }

  get getBucketName() {
    return this.bucket.name;
  }
}
