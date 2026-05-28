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
        width: number;
        height: number;
        duration: number;
        mimeType: VideoMimeType;
        thumbnail: Image;
    };
}

export type MediaItem = MediaImageItem | MediaVideoItem;