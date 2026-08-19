import type { Area } from "react-easy-crop";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Genera un Blob JPEG recortado a partir de un Object URL y las coordenadas de react-easy-crop */
export async function getCroppedImage(
  imageSrc: string,
  crop: Area,
  options: { width?: number; height?: number; quality?: number } = {},
): Promise<Blob> {
  const img = await loadImage(imageSrc);

  const outW = options.width ?? 1500;
  const outH = options.height ?? 500;
  const quality = options.quality ?? 0.9;

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo inicializar el canvas.");

  ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, 0, 0, outW, outH);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("El canvas no produjo ningún resultado."));
      },
      "image/jpeg",
      quality,
    );
  });
}

/** Valida que una imagen tenga suficiente resolución para ser usada como portada */
export function validateBannerImage(
  naturalWidth: number,
  naturalHeight: number,
): { valid: boolean; message?: string } {
  if (naturalWidth < 600 || naturalHeight < 200) {
    return {
      valid: false,
      message:
        "Esta imagen tiene una resolución demasiado baja para utilizarla como portada. Selecciona una imagen con mayor resolución (mínimo 600 × 200 px).",
    };
  }
  return { valid: true };
}
