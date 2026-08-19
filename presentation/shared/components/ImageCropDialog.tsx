"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import type { Area, Point } from "react-easy-crop";
import { Loader2, ZoomIn, ZoomOut } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { getCroppedImage } from "@/presentation/shared/lib/getCroppedImage";

export interface ImageCropDialogProps {
  open: boolean;
  /** Object URL de la imagen seleccionada */
  imageUrl: string;
  /** Ratio ancho/alto del área de recorte (ej: 3 para 3:1) */
  aspect: number;
  title?: string;
  description?: string;
  /** Dimensiones de la imagen de salida en píxeles */
  outputWidth?: number;
  outputHeight?: number;
  /** Calidad JPEG 0–1 */
  quality?: number;
  /** Zoom inicial */
  initialZoom?: number;
  minZoom?: number;
  maxZoom?: number;
  onCancel: () => void;
  /** Se llama con el Blob de la imagen ya recortada */
  onConfirm: (blob: Blob) => Promise<void>;
}

export function ImageCropDialog({
  open,
  imageUrl,
  aspect,
  title = "Ajustar portada",
  description = "Mueve y ajusta la imagen para obtener el encuadre deseado.",
  outputWidth = 1500,
  outputHeight = 500,
  quality = 0.9,
  initialZoom = 1,
  minZoom = 1,
  maxZoom = 3,
  onCancel,
  onConfirm,
}: ImageCropDialogProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(initialZoom);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedArea(pixels);
  }, []);

  const handleApply = async () => {
    if (!croppedArea) return;
    setIsProcessing(true);
    try {
      const blob = await getCroppedImage(imageUrl, croppedArea, {
        width: outputWidth,
        height: outputHeight,
        quality,
      });
      await onConfirm(blob);
    } catch {
      // El error se maneja en onConfirm (notify en ProfileBanner)
    } finally {
      setIsProcessing(false);
    }
  };

  // Resetear estado cuando se cierra/abre
  const handleOpenChange = (open: boolean) => {
    if (!open && !isProcessing) onCancel();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="gap-0 overflow-hidden p-0 sm:max-w-2xl"
        showCloseButton={false}
        // Impedir cierre accidental mientras se procesa
        onInteractOutside={(e) => { if (isProcessing) e.preventDefault(); }}
        onEscapeKeyDown={(e) => { if (isProcessing) e.preventDefault(); }}
      >
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {/* ── Área de recorte ── */}
        <div
          className="relative w-full overflow-hidden bg-zinc-900"
          style={{ height: 320 }}
          aria-label="Área de recorte de imagen"
        >
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            minZoom={minZoom}
            maxZoom={maxZoom}
            rotation={0}
            cropShape="rect"
            showGrid={false}
            restrictPosition
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            style={{
              containerStyle: { background: "#18181b" },
              cropAreaStyle: {
                border: "2px solid rgba(255,255,255,0.85)",
                boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)",
              },
            }}
            zoomSpeed={0.3}
            zoomWithScroll
          />
        </div>

        {/* ── Control de zoom ── */}
        <div className="flex items-center gap-3 px-5 py-3 border-y border-border/50">
          <button
            type="button"
            aria-label="Reducir zoom"
            onClick={() => setZoom((z) => Math.max(minZoom, z - 0.2))}
            className="text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            <ZoomOut className="size-4" />
          </button>
          <input
            type="range"
            min={minZoom}
            max={maxZoom}
            step={0.01}
            value={zoom}
            aria-label="Nivel de zoom"
            onChange={(e) => setZoom(Number(e.target.value))}
            className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-border accent-primary [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-sm"
          />
          <button
            type="button"
            aria-label="Aumentar zoom"
            onClick={() => setZoom((z) => Math.min(maxZoom, z + 0.2))}
            className="text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            <ZoomIn className="size-4" />
          </button>
        </div>

        {/* ── Pie del diálogo ── */}
        <DialogFooter className="px-5 py-4">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isProcessing}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleApply}
            disabled={isProcessing || !croppedArea}
            className="min-w-28"
          >
            {isProcessing ? (
              <>
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
                Procesando…
              </>
            ) : (
              "Aplicar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
