"use client";

import { Button } from "@/app/components/ui/button";
import { ImageUp, X, Loader2, AlertCircle } from "lucide-react";
import Image from "next/image";
import {
  LazyMotion,
  motion,
  domAnimation,
  AnimatePresence,
} from "framer-motion";
import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { cn } from "@/app/lib/utils/cn";
import { MediaItem } from "@/application/dto/events/EventDto";

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

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/*": [".jpg", ".jpeg", ".png", ".webp"],
      "video/*": [".mp4", ".webm", ".ogg"],
    },
    maxFiles: 10,
    multiple: true,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        onChange(acceptedFiles);
      }
    },
  });

  return (
    <LazyMotion features={domAnimation}>
      <div className="flex w-full max-w-4xl mx-auto flex-col gap-3">
        <div>
          <h4 className="text-sm font-semibold text-gray-900">
            Galería del evento{" "}
            <span className="text-xs font-normal text-gray-400">
              (opcional)
            </span>
          </h4>
          <p className="mt-0.5 text-xs text-gray-500">
            Sube aquí tus fotos o videos referentes al evento. Puedes agregar
            hasta 10 archivos.
          </p>
        </div>

        <div
          {...getRootProps()}
          role="button"
          aria-label="Zona para subir fotos o videos del evento"
          className={cn(
            "flex aspect-video w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed transition-colors",
            isDragActive
              ? "border-black bg-gray-100"
              : error
                ? "border-red-400 bg-red-50 hover:border-red-500 hover:bg-red-100"
                : "border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100",
          )}
        >
          <input {...getInputProps()} />
          <ImageUp
            className={cn(
              "h-8 w-8",
              isDragActive
                ? "text-black"
                : error
                  ? "text-red-400"
                  : "text-gray-400",
            )}
          />
          <div className="text-center">
            <p
              className={cn(
                "text-sm font-medium",
                error ? "text-red-600" : "text-gray-700",
              )}
            >
              {isDragActive
                ? "Suelta los archivos aquí"
                : "Arrastra imágenes o videos aquí"}
            </p>
            <p
              className={cn(
                "mt-0.5 text-xs",
                error ? "text-red-400" : "text-gray-400",
              )}
            >
              JPG, PNG, WEBP, MP4, WEBM — hasta 10 archivos
            </p>
          </div>
        </div>

        {error && (
          <p role="alert" className="text-xs text-red-500">
            {error}
          </p>
        )}

        {currentFiles.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {currentFiles.map((file) => {
              const isVideo = file.type === "video";
              const isProcessing = file.data.status === "processing";
              const hasError = file.data.status === "error";

              const thumbUrl = isVideo
                ? (file.data.thumbnailUrl || file.data.thumbnail?.url || null)
                : (file.data.temporaryUrl || file.data.url || null);
              const thumbAlt = (isVideo ? file.data.thumbnail?.alt : file.data.alt) || "Media preview";

              return (
                <motion.div
                  layoutId={`media-${file.id}`}
                  key={file.id}
                  onClick={() => {
                    if (isProcessing || hasError) return;
                    setSelectedFile(file);
                  }}
                  style={{ zIndex: selectedFile?.id === file.id ? 50 : 1 }}
                  className={cn(
                    "group relative aspect-square overflow-hidden rounded-xl bg-gray-900",
                    (isProcessing || hasError) ? "cursor-not-allowed" : "cursor-pointer"
                  )}
                >
                  {thumbUrl && (
                    <Image
                      src={thumbUrl}
                      alt={thumbAlt}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                      className={cn(
                        "object-cover transition-opacity",
                        isProcessing ? "opacity-40" : hasError ? "opacity-20" : "opacity-80"
                      )}
                    />
                  )}

                  {isProcessing && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/10 backdrop-blur-[1px]">
                      <Loader2 className="h-5 w-5 text-white animate-spin" />
                      <span className="text-[9px] font-medium text-white tracking-wider uppercase animate-pulse">
                        Procesando
                      </span>
                    </div>
                  )}

                  {hasError && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-red-950/40 backdrop-blur-[1px] p-2 text-center">
                      <AlertCircle className="h-5 w-5 text-red-400" />
                      <span className="text-[9px] font-bold text-red-200 tracking-wider uppercase">
                        Error
                      </span>
                    </div>
                  )}

                  {isVideo && !isProcessing && !hasError && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="rounded-full bg-black/50 p-2">
                        <svg
                          className="h-4 w-4 text-white"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeMediaFile(file.id);
                    }}
                    aria-label="Eliminar archivo"
                    className={cn(
                      "absolute right-2 top-2 z-10 rounded-full border border-gray-200 bg-white p-1 shadow-sm transition-opacity group-hover:opacity-100 disabled:opacity-30 disabled:cursor-not-allowed",
                      hasError ? "opacity-100" : "opacity-0"
                    )}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}

        <AnimatePresence>
          {selectedFile && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
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
                    className="h-full w-full object-contain"
                    controls
                    autoPlay
                  />
                ) : (
                  <Image
                    src={selectedFile.data.url || selectedFile.data.temporaryUrl || ""}
                    alt={selectedFile.data.alt || "Preview"}
                    sizes="(max-width: 768px) 100vw, 768px"
                    fill
                    className="object-cover"
                  />
                )}

                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  aria-label="Cerrar vista previa"
                  className="absolute right-4 top-4 rounded-full bg-black/60 p-2 text-white hover:bg-black/80"
                >
                  <X className="h-5 w-5" />
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </LazyMotion>
  );
};