
export function getImageData(file: File): Promise<{ width: number; height: number; alt: string }> {
  return new Promise((resolve, reject) => {
    const image = document.createElement("img");
    image.src = URL.createObjectURL(file);
    image.onload = () => {
      const width = image.naturalWidth;
      const height = image.naturalHeight;
      const alt = file.name;

      URL.revokeObjectURL(image.src);
      resolve({ width, height, alt });
    };
  });
}