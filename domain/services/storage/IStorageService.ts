export interface IStorageService {
    upload(file: File, options?: {
        folder?: string;
        fileName?: string;
        visibility?: 'public' | 'private';
        metadata?: {
            contentType?: string;
            customMetadata?: {
                [key: string]: string;
            };
        };
    }) : Promise<{ url: string, path: string }>;

    delete(path: string): Promise<void>;

    generateSignedUrl(
        path: string,
        isPublic: boolean,
        contentType?: string,
        customMetadata?: Record<string, string>,
    ): Promise<string>;
}