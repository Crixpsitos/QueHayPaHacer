export function getVideoData(file: File): Promise<{ thumbnail: File; width: number; height: number, duration: number; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    
    const objectUrl = URL.createObjectURL(file);
    video.src = objectUrl;

    video.onloadeddata = () => { video.currentTime = 0.1; };

    video.onseeked = () => {
      const width = video.videoWidth;
      const height = video.videoHeight;
      const duration = video.duration 
      const mimeType = file.type;

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      ctx?.drawImage(video, 0, 0, width, height);

      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error("Error al generar blob"));
        
        const thumbnail = new File([blob], `thumb-${file.name.split(".")[0]}.jpeg`, { type: "image/jpeg" });
        
        URL.revokeObjectURL(objectUrl);
        
        resolve({ thumbnail, width, height, duration, mimeType });
      }, "image/jpeg", 0.85);
    };
  });
}