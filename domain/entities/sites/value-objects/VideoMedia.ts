import { ImageMedia } from "./ImageMedia"

export type VideoMimeType = "video/mp4" | "video/webm" | "video/ogg";

export class VideoMedia {
    readonly type = "video" as const;

    constructor(
    public readonly id: string,
    public readonly url: string,
    public readonly width: number,
    public readonly height: number,
    public readonly duration: number,
    public readonly mimeType: VideoMimeType,
    public readonly thumbnail: ImageMedia,
  ) {
    if (duration <= 0) throw new Error("Duración de video inválida")
    if (width <= 0 || height <= 0) throw new Error("Dimensiones de video inválidas")
  }
}