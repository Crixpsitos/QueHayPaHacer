"use client";

import { Button } from "@/app/components/ui/button";
import { cn } from "@/app/lib/utils/cn";
import { ImageUp, Loader2, X, AlertCircle } from "lucide-react";
import Image from "next/image";
import {  useCallback, useEffect, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Field, FieldError, FieldLabel } from "@/app/components/ui/field";



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

  console.log("displayUrl", displayUrl);

  const isProcessing = typeof value === "object" && value?.status === "processing";
  const hasOptimizationError = typeof value === "object" && value?.status === "error";

  useEffect(() => {
    if (!pendingPreviewUrl) return;
    return () => URL.revokeObjectURL(pendingPreviewUrl);
  }, [pendingPreviewUrl]);

  const handleDirectUpload = useCallback(() => {
    if (!pendingFile) return;
    // Do not clear pendingFile immediately so preview remains during upload.
    onChange(pendingFile);
  }, [pendingFile, onChange]);

  const handleRemoveImage = useCallback(() => {
    if (pendingFile) {
      setPendingFile(null);
    }
    removeMainImage();
  }, [pendingFile, removeMainImage]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/*": [".jpg", ".jpeg", ".png", ".webp", ".gif"],
    },
    maxFiles: 1,
    disabled: isProcessing,
    onDrop: (accepted) => {
      if (!accepted[0]) return;
      setPendingFile(accepted[0]);
    },
  });

  return (
    <Field
      data-invalid={!!error}
      className="w-full max-w-4xl mx-auto flex flex-col gap-2"
    >
      <FieldLabel>Imagen principal del evento</FieldLabel>

      {displayUrl ? (
        <div className="relative group overflow-hidden rounded border border-gray-200 shadow-sm bg-gray-50">
          <div className="relative aspect-video w-full">
            <Image
              src={displayUrl}
              alt="Main event image preview"
              fill
              sizes="(max-width: 1200px) 100vw, 1200px"
              className="object-cover"
              priority={false}
            />
          </div>

          {/* ⏳ ESTADO 1: Procesando / Optimizando */}
          {isProcessing && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2 transition-all">
              <Loader2 className="h-7 w-7 text-white animate-spin" />
              <span className="text-xs font-semibold text-white tracking-wide animate-pulse">
                ⚡ OPTIMIZANDO PARA LA WEB...
              </span>
            </div>
          )}

          {/* 🚨 ESTADO 2: Error Genérico de Procesamiento */}
          {hasOptimizationError && (
            <div className="absolute inset-0 bg-red-950/75 backdrop-blur-[2px] flex flex-col items-center justify-center gap-1 p-4 text-center transition-all">
              <AlertCircle className="h-7 w-7 text-red-400" />
              <span className="text-xs font-bold text-white tracking-wide uppercase">
                Error de procesamiento
              </span>
              <p className="text-[11px] text-gray-200 max-w-xs leading-relaxed">
                No pudimos procesar la imagen correctamente en este momento. Intenta eliminarla e ingresarla de nuevo.
              </p>
            </div>
          )}

          {/* Botón de eliminar (Se mantiene DESHABILITADO en procesamiento, pero se ACTIVA en caso de error) */}
          <Button
            type="button"
            disabled={isProcessing}
            onClick={handleRemoveImage}
            className="absolute top-2 right-2 rounded-lg border border-gray-300 bg-white/90 p-2 shadow-md backdrop-blur-sm text-gray-700 hover:bg-white hover:text-red-600 transition disabled:opacity-30 disabled:cursor-not-allowed z-10"
            aria-label="Remove main image"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          role="button"
          aria-label="Zona para subir imagen del evento"
          className={cn(
            "flex aspect-video w-full cursor-pointer flex-col items-center justify-center gap-3 rounded border-2 border-dashed border-gray-300 bg-gray-50 transition-colors",
            isDragActive
              ? "border-black bg-gray-100"
              : "hover:border-gray-400 hover:bg-gray-100",
          )}
        >
          <input {...getInputProps()} />
          <ImageUp
            className={cn(
              "h-10 w-10 transition-colors",
              isDragActive ? "text-black" : "text-gray-400",
            )}
            aria-hidden
          />
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700">
              {isDragActive
                ? "Suelta la imagen aquí"
                : "Sube tu imagen principal"}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              JPG, JPEG, PNG o WEBP · Arrastra o haz clic
            </p>
          </div>
        </div>
      )}

      {pendingFile && !isProcessing && !fileUrl && (
        <div className="rounded-xl border border-zinc-200 bg-gradient-to-br from-zinc-50 to-white p-4 shadow-sm">
          <h4 className="text-sm font-semibold text-zinc-900">Imagen lista para subir</h4>
          <p className="mt-1 text-sm leading-relaxed text-zinc-600">
            Revisa la previsualización y presiona subir para guardar la imagen principal.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Button type="button" onClick={handleDirectUpload} className="sm:w-auto">
              Subir imagen
            </Button>
            <Button type="button" variant="outline" onClick={() => setPendingFile(null)} className="sm:w-auto">
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any*/}
      {error && <FieldError errors={[{ message: error } as any]} />}
    </Field>
  );
};