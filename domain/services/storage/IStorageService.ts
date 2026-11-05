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

    /** Milisegundos desde la última modificación del objeto, o null si no existe. */
    ageMs(path: string): Promise<number | null>;

    /** Reescribe el objeto sobre sí mismo (nueva generación): vuelve a disparar `onObjectFinalized`. */
    retrigger(path: string): Promise<void>;

    generateSignedUrl(
        path: string,
        isPublic: boolean,
        contentType?: string,
        customMetadata?: Record<string, string>,
        cacheControl?: string,
    ): Promise<string>;
}