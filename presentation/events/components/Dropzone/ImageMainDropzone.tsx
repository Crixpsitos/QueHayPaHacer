"use client";

import { cn } from "@/app/lib/utils/cn";
import { UploadCloud, ImageIcon, Loader2, X, AlertCircle, RefreshCw } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { FieldError } from "@/app/components/ui/field";

type MainImageValue =
  | string
  | {
      status?: "processing" | "ready" | "error";
      temporaryUrl?: string | null;
      desktop?: { url?: string } | null;
    };

interface ImageDropzoneProps {
  value: MainImageValue | null | undefined;
  onChange: (file: File | null) => void;
  error?: string;
  removeMainImage: () => void;
}

export const ImageMainDropzone = ({
  value,
  onChange,
  error,
  removeMainImage,
}: ImageDropzoneProps) => {
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const fileUrl = useMemo(() => {
    if (!value) return null;
    if (typeof value === "string") return value;
    return value.desktop?.url || value.temporaryUrl || null;
  }, [value]);

  const pendingPreviewUrl = useMemo(() => {
    if (!pendingFile) return null;
    return URL.createObjectURL(pendingFile);
  }, [pendingFile]);

  const displayUrl = fileUrl ?? pendingPreviewUrl;
  const isProcessing = typeof value === "object" && value?.status === "processing";
  const hasOptimizationError = typeof value === "object" && value?.status === "error";
  // Error de validación local (p.ej. resolución insuficiente): muestra overlay en vez de desaparecer bruscamente
  const hasValidationError = Boolean(error && pendingFile && !fileUrl);

  useEffect(() => {
    if (!pendingPreviewUrl) return;
    return () => URL.revokeObjectURL(pendingPreviewUrl);
  }, [pendingPreviewUrl]);

  const handleRemoveImage = useCallback(() => {
    setPendingFile(null);
    removeMainImage();
  }, [removeMainImage]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp"] },
    maxFiles: 1,
    disabled: isProcessing,
    noClick: true, // manejamos click con el botón "Elegir archivo"
    onDrop: (accepted) => {
      if (!accepted[0]) return;
      setPendingFile(accepted[0]);
      onChange(accepted[0]);
    },
  });

  return (
    <div className="rounded-2xl border border-[#F4F4F5] bg-white p-5 shadow-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1">
          <h3 className="text-base font-semibold text-[#09090B]">Imagen principal</h3>
          <span className="text-[#E63946] font-bold text-sm leading-none">*</span>
        </div>
        {displayUrl && !isProcessing && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={open}
              className="flex items-center gap-1.5 rounded-full border border-[#E4E4E7] bg-white px-3 py-1 text-xs font-medium text-[#09090B] hover:border-[#09090B] transition-colors"
            >
              <RefreshCw className="size-3" />
              Cambiar
            </button>
            <button
              type="button"
              onClick={handleRemoveImage}
              className="flex items-center gap-1.5 rounded-full border border-[#E4E4E7] bg-white px-3 py-1 text-xs font-medium text-[#71717A] hover:border-[#E63946] hover:text-[#E63946] transition-colors"
            >
              <X className="size-3" />
              Eliminar
            </button>
          </div>
        )}
      </div>

      {/* Zona principal */}
      {/* Input siempre en el DOM para que open() funcione desde el botón "Cambiar" */}
      <input {...getInputProps()} className="hidden" />
      {displayUrl ? (
        /* ── Estado: con imagen (preview / procesando / error) ── */
        <div className="relative overflow-hidden rounded-xl aspect-video bg-[#F4F4F5]">
          <Image
            src={displayUrl}
            alt="Preview imagen principal"
            fill
            sizes="(max-width: 1200px) 100vw, 1200px"
            className="object-cover"
            priority={false}
          />

          {/* Overlay error de validación (resolución insuficiente, etc.) */}
          {hasValidationError && (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2 p-4 text-center">
              <AlertCircle className="size-8 text-[#FFB703]" />
              <span className="text-sm font-bold text-white">Imagen no válida</span>
              <p className="text-xs text-white/80 max-w-xs leading-relaxed">{error}</p>
              <button
                type="button"
                onClick={handleRemoveImage}
                className="mt-1 rounded-full border border-white/40 bg-white/20 px-4 py-1.5 text-xs font-semibold text-white hover:bg-white/30 transition-colors"
              >
                Elegir otra imagen
              </button>
            </div>
          )}

          {/* Overlay procesando */}
          {isProcessing && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2">
              <Loader2 className="size-8 text-white animate-spin" />
              <span className="text-xs font-semibold text-white tracking-wide animate-pulse">
                Optimizando para la web...
              </span>
            </div>
          )}

          {/* Overlay error */}
          {hasOptimizationError && (
            <div className="absolute inset-0 bg-[#E63946]/80 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2 p-4 text-center">
              <AlertCircle className="size-8 text-white" />
              <span className="text-sm font-bold text-white">Error de procesamiento</span>
              <p className="text-xs text-white/80 max-w-xs leading-relaxed">
                No pudimos procesar la imagen. Elimínala e intenta de nuevo.
              </p>
              <button
                type="button"
                onClick={handleRemoveImage}
                className="mt-1 rounded-full border border-white/40 bg-white/20 px-3 py-1 text-xs font-semibold text-white hover:bg-white/30 transition-colors"
              >
                Eliminar imagen
              </button>
            </div>
          )}
        </div>
      ) : (
        /* ── Estado: vacío — drop zone ── */
        <div
          {...getRootProps()}
          className={cn(
            "flex h-55 w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed bg-[#F8F8FA] transition-colors",
            isDragActive
              ? "border-[#E63946] bg-[#FDF2F4]"
              : error
              ? "border-[#E63946]/50 bg-[#FDF2F4]/50"
              : "border-[#E4E4E7] hover:border-[#A1A1AA]",
          )}
        >
          <UploadCloud
            className={cn(
              "size-10 transition-colors",
              isDragActive ? "text-[#E63946]" : "text-[#A1A1AA]",
            )}
          />
          <div className="text-center">
            <p className="text-sm font-semibold text-[#09090B]">
              {isDragActive ? "Suelta aquí" : "Arrastra la imagen principal"}
            </p>
            <p className="mt-1 text-xs text-[#71717A]">PNG o JPG · mín. 1280×720 · hasta 8 MB</p>
          </div>
          <button
            type="button"
            onClick={open}
            className="flex items-center gap-1.5 rounded-full border border-[#E4E4E7] bg-white px-4 py-2 text-xs font-medium text-[#09090B] hover:border-[#09090B] transition-colors shadow-subtle"
          >
            <ImageIcon className="size-3.5" />
            Elegir archivo
          </button>
        </div>
      )}

      {/* Texto informativo */}
      <p className="mt-3 text-xs text-[#71717A] leading-relaxed">
        Formato 16:9 · mín. 1280×720 (HD). La procesamos en segundo plano; puedes seguir llenando el formulario mientras termina.
      </p>

      {/* Error de validación */}
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {error && <FieldError errors={[{ message: error } as any]} />}
    </div>
  );
};


