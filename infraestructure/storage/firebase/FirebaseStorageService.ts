/* eslint-disable @typescript-eslint/no-explicit-any */
import { IStorageService } from "@/domain/services/storage/IStorageService";
import { getFirebaseStorage } from "@/infraestructure/firebase/config/admin/firebase";
import { TransferManager } from "@google-cloud/storage";
import path from "node:path";
import os from "os";
import fs from "fs";

export class StorageService implements IStorageService {
  private storage = getFirebaseStorage();
  private bucket = this.storage.bucket();
  private transferManager = new TransferManager(this.bucket);

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

  uploadMany = async (
    files: File[],
    options: {
      folder?: string;
      visibility?: "public" | "private";
      metadata?: {
        contentType?: string;
        customMetadata?: {
          [key: string]: string;
        };
      };
    } = {},
  ): Promise<{ url: string; path: string }[]> => {
    const localPaths: string[] = [];
    const baseFolder = options?.folder ?? "uploads";
    const prefix = baseFolder.endsWith("/") ? baseFolder : `${baseFolder}/`;
    const isPublic = options?.visibility === "public";

    try {
      for (const file of files) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const tempPath = path.join(
          os.tmpdir(),
          `${crypto.randomUUID()}-${file.name}`,
        );
        fs.writeFileSync(tempPath, buffer);
        localPaths.push(tempPath);
      }

      await this.transferManager.uploadManyFiles(localPaths, {
        prefix: prefix,
        concurrencyLimit: 10,
        passthroughOptions: {
          resumable: false,
          public: isPublic,
          metadata: {
            contentType: options?.metadata?.contentType,
            cacheControl: "public, max-age=31536000",
            metadata: {
              ...options?.metadata?.customMetadata,
            },
          },
        },
      });

      const results = await Promise.all(
        localPaths.map(async (localPath) => {
          const baseName = path.basename(localPath);
          const fullPath = `${prefix}${baseName}`;

          if (isPublic) {
            return {
              url: `https://storage.googleapis.com/${this.bucket.name}/${fullPath}`,
              path: fullPath,
            };
          }

          const fileRef = this.bucket.file(fullPath);
          const [signedUrl] = await fileRef.getSignedUrl({
            action: "read",
            expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
          });

          return {
            url: signedUrl,
            path: fullPath,
          };
        }),
      );

      return results;
    } catch (error) {
      throw error;
    } finally {
      for (const localPath of localPaths) {
        if (fs.existsSync(localPath)) {
          fs.unlinkSync(localPath);
        }
      }
    }
  };

  async generateSignedUrl(
  path: string,
  isPublic: boolean,
  contentType?: string,
  customMetadata?: Record<string, string>,
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
