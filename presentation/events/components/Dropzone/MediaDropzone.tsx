"use client";

import { ImagePlus, X, Loader2, AlertCircle } from "lucide-react";
import Image from "next/image";
import { LazyMotion, motion, domAnimation, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { cn } from "@/app/lib/utils/cn";
import { MediaItem } from "@/application/dto/events/EventDto";

const MAX_GALLERY = 6;

interface MediaDropzoneProps {
  value: MediaItem[] | null;
  onChange: (files: File[]) => void;
  error?: string;
  removeMediaFile: (id: string) => void;
}

export const MediaDropzone = ({
  value,
  onChange,
  error,
  removeMediaFile,
}: MediaDropzoneProps) => {
  const currentFiles = value ?? [];
  const [selectedFile, setSelectedFile] = useState<MediaItem | null>(null);
  const canAddMore = currentFiles.length < MAX_GALLERY;

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/*": [".jpg", ".jpeg", ".png", ".webp"],
      "video/*": [".mp4", ".webm", ".ogg"],
    },
    maxFiles: MAX_GALLERY - currentFiles.length,
    multiple: true,
    disabled: !canAddMore,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) onChange(acceptedFiles);
    },
  });

  return (
    <LazyMotion features={domAnimation}>
      <div className="rounded-2xl border border-[#F4F4F5] bg-white p-5 shadow-card">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-[#09090B]">Galería adicional</h3>
          <span className="text-xs font-medium text-[#71717A]">{currentFiles.length}/{MAX_GALLERY} archivos</span>
        </div>

        {/* Grid: thumbnails + tile Añadir */}
        <div className="flex flex-wrap gap-3">
          {currentFiles.map((file) => {
            const isVideo = file.type === "video";
            const isProcessing = file.data.status === "processing";
            const hasError = file.data.status === "error";
            const thumbUrl = isVideo
              ? ((file.data as any).thumbnailUrl || (file.data as any).thumbnail?.url || null)
              : (file.data.temporaryUrl || file.data.url || null);
            const thumbAlt = (isVideo ? (file.data as any).thumbnail?.alt : (file.data as any).alt) || "Imagen";

            return (
              <motion.div
                layoutId={`media-${file.id}`}
                key={file.id}
                onClick={() => { if (!isProcessing && !hasError) setSelectedFile(file); }}
                style={{ zIndex: selectedFile?.id === file.id ? 50 : 1 }}
                className={cn(
                  "group relative w-[calc(50%-6px)] sm:w-35 aspect-3/4 rounded-xl overflow-hidden bg-[#F4F4F5]",
                  !isProcessing && !hasError ? "cursor-pointer" : "cursor-not-allowed",
                )}
              >
                {thumbUrl && (
                  <Image src={thumbUrl} alt={thumbAlt} fill sizes="140px"
                    className={cn("object-cover transition-opacity",
                      isProcessing ? "opacity-50" : hasError ? "opacity-20" : "opacity-100"
                    )}
                  />
                )}
                {isProcessing && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/30 backdrop-blur-[1px]">
                    <Loader2 className="size-5 text-white animate-spin" />
                    <span className="text-[10px] font-semibold text-white uppercase tracking-wide animate-pulse">Procesando</span>
                  </div>
                )}
                {hasError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-[#E63946]/60 backdrop-blur-[1px]">
                    <AlertCircle className="size-5 text-white" />
                    <span className="text-[10px] font-bold text-white uppercase">Error</span>
                  </div>
                )}
                {isVideo && !isProcessing && !hasError && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="rounded-full bg-black/50 p-2">
                      <svg className="size-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={(e) => { e.stopPropagation(); removeMediaFile(file.id); }}
                  aria-label="Eliminar archivo"
                  className={cn(
                    "absolute right-1.5 top-1.5 z-10 flex size-6 items-center justify-center rounded-full bg-white/90 shadow-sm text-[#09090B] transition-all hover:text-[#E63946] disabled:opacity-30",
                    hasError ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                  )}
                >
                  <X className="size-3" />
                </button>
              </motion.div>
            );
          })}

          {/* Tile "Añadir" visible cuando hay espacio */}
          {canAddMore && (
            <div
              {...getRootProps()}
              className={cn(
                "flex w-[calc(50%-6px)] sm:w-35 aspect-3/4 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed cursor-pointer transition-colors",
                isDragActive
                  ? "border-[#E63946] bg-[#FDF2F4]"
                  : "border-[#E4E4E7] bg-[#F8F8FA] hover:border-[#A1A1AA] hover:bg-[#F4F4F5]",
              )}
            >
              <input {...getInputProps()} />
              <ImagePlus className={cn("size-6 transition-colors", isDragActive ? "text-[#E63946]" : "text-[#A1A1AA]")} />
              <span className={cn("text-xs font-medium", isDragActive ? "text-[#E63946]" : "text-[#71717A]")}>
                Añadir
              </span>
            </div>
          )}
        </div>

        {error && <p role="alert" className="mt-2 text-xs text-[#E63946]">{error}</p>}

        <p className="mt-3 text-xs text-[#71717A] leading-relaxed">
          Opcional. Fotos o videos de ediciones anteriores, el cartel o el espacio ayudan a decidir.
        </p>

        {/* Lightbox */}
        <AnimatePresence>
          {selectedFile && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setSelectedFile(null)}
                className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
              />
              <motion.div
                layoutId={`media-${selectedFile.id}`}
                className="fixed inset-0 z-50 m-auto aspect-square w-full max-w-2xl overflow-hidden rounded-2xl bg-black"
              >
                {selectedFile.type === "video" ? (
                  <video
                    src={selectedFile.data.url || selectedFile.data.temporaryUrl || undefined}
                    className="h-full w-full object-contain" controls autoPlay
                  />
                ) : (
                  <Image
                    src={selectedFile.data.url || selectedFile.data.temporaryUrl || ""}
                    alt={(selectedFile.data as any).alt || "Preview"}
                    fill sizes="(max-width: 768px) 100vw, 768px"
                    className="object-cover"
                  />
                )}
                <button type="button" onClick={() => setSelectedFile(null)} aria-label="Cerrar"
                  className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80">
                  <X className="size-4" />
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </LazyMotion>
  );
};
