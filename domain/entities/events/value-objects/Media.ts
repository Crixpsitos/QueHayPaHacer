import { Image } from "@/domain/shared/Image";

export interface MediaImageItem {
    id: string; 
    type: "image";
    data: Image;
}

export type VideoMimeType = "video/mp4" | "video/webm" | "video/ogg";

export interface MediaVideoItem {
    id: string;
    type: "video";
    data: {
        url: string;
        path?: string;
        originalPath?: string;
        width: number;
        height: number;
        duration: number;
        mimeType: VideoMimeType;
        status?: "processing" | "ready" | "error";
        temporaryUrl?: string;
        thumbnail?: Image;
        // Flat fields set by the backend Cloud Function after processing
        thumbnailUrl?: string;
        thumbnailPath?: string;
    };
}

export type MediaItem = MediaImageItem | MediaVideoItem;