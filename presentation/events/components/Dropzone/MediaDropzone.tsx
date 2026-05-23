import { ImageUp, X } from "lucide-react";
import Image from "next/image";
import {
  LazyMotion,
  motion,
  domAnimation,
  AnimatePresence,
} from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { cn } from "@/app/lib/utils/cn";

interface MediaDropzoneProps {
  value: File[] | null;
  onChange: (files: File[] | null) => void;
  error?: string;
  removeMediaFile: (name: string) => void;
}

export const MediaDropzone = ({
  value,
  onChange,
  error,
  removeMediaFile,
}: MediaDropzoneProps) => {
  const currentFiles = useMemo(() => value ?? [], [value]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fileUrls = useMemo(() => {
    const map = new Map<string, string>();
    currentFiles.forEach((file) => {
      map.set(file.name, URL.createObjectURL(file));
    });
    return map;
  }, [currentFiles]);


  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/*": [".jpg", ".jpeg", ".png", ".webp"],
      "video/*": [".mp4", ".webm", ".ogg"],
    },
    maxFiles: 10,
    multiple: true,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        onChange([...currentFiles, ...acceptedFiles]);
      }
    },
  });

  return (
    <LazyMotion features={domAnimation}>
      <div className="flex w-full max-w-4xl mx-auto flex-col gap-3">
        {/* Encabezado de sección */}
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

        {/* Zona de drop */}
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

        {/* Mensaje de error */}
        {error && (
          <p role="alert" className="text-xs text-red-500">
            {error}
          </p>
        )}

        {/* Grid de archivos */}
        {currentFiles.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {currentFiles.map((file) => {
              const isVideo = file.type.startsWith("video/");
              const fileUrl = fileUrls.get(file.name) ?? "";

              return (
                <motion.div
                  layoutId={`media-${file.name}`}
                  key={file.name}
                  onClick={() => setSelectedFile(file)}
                  style={{ zIndex: selectedFile?.name === file.name ? 50 : 1 }}
                  className="group relative aspect-square cursor-pointer overflow-hidden rounded-xl bg-gray-900"
                >
                  <div className="relative h-full w-full">
                    {isVideo ? (
                      <video
                        src={fileUrl}
                        className="h-full w-full object-cover opacity-80"
                        muted
                      />
                    ) : (
                      <Image
                        src={fileUrl}
                        alt={file.name}
                        fill
                        className="object-cover"
                      />
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeMediaFile(file.name);
                    }}
                    aria-label={`Eliminar ${file.name}`}
                    className="absolute right-2 top-2 z-10 rounded-full border border-gray-200 bg-white p-1 shadow-sm opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Vista previa en overlay */}
        <AnimatePresence>
          {selectedFile && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedFile(null)}
                className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
              />

              <motion.div
                layoutId={`media-${selectedFile.name}`}
                className="fixed inset-0 z-50 m-auto aspect-square w-full max-w-2xl overflow-hidden rounded-2xl bg-black"
              >
                {selectedFile.type.startsWith("video/") ? (
                  <video
                    src={fileUrls.get(selectedFile.name) ?? ""}
                    className="h-full w-full object-contain"
                    controls
                    autoPlay
                  />
                ) : (
                  <Image
                    src={fileUrls.get(selectedFile.name) ?? ""}
                    alt="Vista previa"
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
