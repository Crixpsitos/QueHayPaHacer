export class ImageMedia {
    readonly type = "image" as const;
 constructor(
    public readonly id: string,
    public readonly url: string,
    public readonly width: number,
    public readonly height: number,
    public readonly alt: string,
    public readonly markerUrl: string,
    public readonly isCover: boolean,    
  ) {
    if (!url) throw new Error("URL de imagen requerida")
    if (width <= 0 || height <= 0) throw new Error("Dimensiones inválidas")
  }
}