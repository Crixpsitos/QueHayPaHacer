"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { Camera, Ellipsis, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/app/lib/utils/cn";
import { uploadToGoogleStorage } from "@/presentation/events/lib/upload/uploadToGoogleStorage";
import { updateBannerAction } from "@/app/actions/profile/update-banner.action";
import { deleteBannerAction } from "@/app/actions/profile/delete-banner.action";
import { notify } from "@/presentation/shared/lib/notify";
import { useAuth } from "@/app/store/auth/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { ImageCropDialog } from "@/presentation/shared/components/ImageCropDialog";
import { validateBannerImage } from "@/presentation/shared/lib/getCroppedImage";
import {
  BANNER_ASPECT_RATIO,
  BANNER_OUTPUT_HEIGHT,
  BANNER_OUTPUT_WIDTH,
  VariantBackground,
  resolveVariant,
  type BannerVariant,
} from "../lib/bannerVariants";

const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8 MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface ProfileBannerProps {
  bannerUrl?: string | null;
  /** Muestra los controles de edición cuando es true (solo propietario) */
  editable?: boolean;
  uid?: string;
  onBannerChange?: (bannerUrl: string, bannerPath: string) => void;
  className?: string;
  children?: React.ReactNode;
}

// ── Componente ────────────────────────────────────────────────────────────────

export function ProfileBanner({
  bannerUrl,
  editable = false,
  uid,
  onBannerChange,
  className,
  children,
}: ProfileBannerProps) {
  const { refreshUser } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);

  const [localUrl, setLocalUrl] = useState<string | null>(null);
  const [variant] = useState<BannerVariant>(() =>
    typeof window === "undefined" ? "soft-gradient" : resolveVariant(uid),
  );

  // Estado del cropper
  const [pendingCropSrc, setPendingCropSrc] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  // Estado de operaciones
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const displayUrl = localUrl ?? bannerUrl;
  const isBusy = isUploading || isDeleting;

  // Limpiar Object URL al desmontar
  useEffect(() => {
    return () => {
      if (pendingCropSrc) URL.revokeObjectURL(pendingCropSrc);
    };
  }, [pendingCropSrc]);

  // ── Selección de archivo ────────────────────────────────────────────────────

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      notify.error("Solo se admiten imágenes JPEG, PNG, WebP o AVIF.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      notify.error("La imagen no puede pesar más de 8 MB.");
      return;
    }

    // Validar resolución antes de abrir el cropper
    const objectUrl = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      const { valid, message } = validateBannerImage(img.naturalWidth, img.naturalHeight);
      if (!valid) {
        URL.revokeObjectURL(objectUrl);
        notify.error(message ?? "Imagen no válida.");
        return;
      }
      setPendingCropSrc(objectUrl);
      setPendingFile(file);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      notify.error("No se pudo leer la imagen seleccionada.");
    };
    img.src = objectUrl;
  };

  // ── Cancelar crop ───────────────────────────────────────────────────────────

  const handleCropCancel = () => {
    if (pendingCropSrc) URL.revokeObjectURL(pendingCropSrc);
    setPendingCropSrc(null);
    setPendingFile(null);
  };

  // ── Confirmar crop → subir ──────────────────────────────────────────────────

  const handleCropConfirm = async (blob: Blob) => {
    if (!uid || !pendingFile) {
      notify.error("No hay sesión activa para actualizar la portada.");
      return;
    }

    const srcToRevoke = pendingCropSrc;
    const originalFile = pendingFile;
    setPendingCropSrc(null);
    setPendingFile(null);
    setIsUploading(true);

    const uploadPromise = (async () => {
      const ext = originalFile.name.split(".").pop() ?? "jpg";
      const croppedFile = new File([blob], `banner-${uid}.${ext}`, {
        type: blob.type,
      });

      const { publicUrl, path } = await uploadToGoogleStorage(
        croppedFile,
        "profile",
        uid,
        { fileName: `banner-${uid}`, contentType: blob.type, isPublic: true, subFolder: "banner", cacheControl: "public, max-age=31536000, immutable" },
      );

      const result = await updateBannerAction({ uid, bannerUrl: publicUrl, bannerPath: path });
      if (!result.success) throw new Error(result.error ?? "No se pudo guardar la portada.");

      // Preview optimista con el blob recortado
      const previewUrl = URL.createObjectURL(blob);
      setLocalUrl(previewUrl);
      onBannerChange?.(publicUrl, path);
      await refreshUser();
    })();

    try {
      await notify.promise(uploadPromise, {
        loading: "Subiendo portada…",
        success: () => "Portada actualizada.",
        error: (err) => (err instanceof Error ? err.message : "No se pudo subir la portada."),
      });
    } catch { /* notify.promise ya muestra el error */ } finally {
      setIsUploading(false);
      if (srcToRevoke) URL.revokeObjectURL(srcToRevoke);
    }
  };

  // ── Eliminar banner ─────────────────────────────────────────────────────────

  const handleDeleteBanner = async () => {
    if (!uid) { notify.error("No hay sesión activa."); return; }
    setShowDeleteConfirm(false);
    setIsDeleting(true);

    const deletePromise = (async () => {
      const result = await deleteBannerAction(uid);
      if (!result.success) throw new Error(result.error ?? "No se pudo eliminar la portada.");
      setLocalUrl(null);
      await refreshUser();
    })();

    try {
      await notify.promise(deletePromise, {
        loading: "Eliminando portada…",
        success: () => "Portada eliminada.",
        error: (err) => (err instanceof Error ? err.message : "No se pudo eliminar la portada."),
      });
    } catch { /* notify.promise ya muestra el error */ } finally {
      setIsDeleting(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      <div className={cn("relative h-44 overflow-hidden bg-muted sm:h-56", className)}>
        {/* Fondo: imagen personalizada o variante decorativa */}
        {displayUrl ? (
          <>
            <Image
              src={displayUrl}
              alt="Portada del perfil"
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 80vw, 1024px"
              className="object-cover"
              priority
            />
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-card/70 to-transparent"
              aria-hidden
            />
          </>
        ) : (
          <VariantBackground variant={variant} />
        )}

        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-linear-to-t from-card/20 to-transparent"
          aria-hidden
        />

        {/* ── Controles de edición ── */}
        {editable && (
          <>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED_TYPES.join(",")}
              className="sr-only"
              aria-label="Seleccionar imagen de portada"
              onChange={handleFileChange}
            />

            {/* MOBILE: botón compacto con dropdown */}
            <div className="absolute bottom-3 right-3 sm:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label="Acciones de portada"
                    disabled={isBusy}
                    className="inline-flex size-9 items-center justify-center rounded-lg border border-white/30 bg-black/35 text-white backdrop-blur-sm transition-all hover:bg-black/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:pointer-events-none disabled:opacity-60"
                  >
                    {isBusy ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                    ) : (
                      <Ellipsis className="size-4" aria-hidden />
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" sideOffset={6}>
                  <DropdownMenuItem
                    onClick={() => inputRef.current?.click()}
                    disabled={isBusy}
                  >
                    <Camera className="size-4" aria-hidden />
                    Cambiar portada
                  </DropdownMenuItem>
                  {displayUrl && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setShowDeleteConfirm(true)}
                        disabled={isBusy}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="size-4" aria-hidden />
                        Eliminar portada
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* DESKTOP: botones de texto */}
            <div className="absolute bottom-3 right-3 hidden items-center gap-1.5 sm:flex">
              {displayUrl && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isBusy}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/30 bg-black/30 px-2.5 py-1.5 text-[11px] font-medium text-white backdrop-blur-sm transition-all hover:bg-red-600/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:pointer-events-none disabled:opacity-60"
                  aria-label="Eliminar portada"
                >
                  {isDeleting ? (
                    <Loader2 className="size-3.5 animate-spin" aria-hidden />
                  ) : (
                    <Trash2 className="size-3.5" aria-hidden />
                  )}
                  {isDeleting ? "Eliminando…" : "Eliminar portada"}
                </button>
              )}
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={isBusy}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/30 bg-black/30 px-2.5 py-1.5 text-[11px] font-medium text-white backdrop-blur-sm transition-all hover:bg-black/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:pointer-events-none disabled:opacity-60"
                aria-label="Cambiar portada"
              >
                {isUploading ? (
                  <Loader2 className="size-3.5 animate-spin" aria-hidden />
                ) : (
                  <Camera className="size-3.5" aria-hidden />
                )}
                {isUploading ? "Subiendo…" : "Cambiar portada"}
              </button>
            </div>

            {/* Confirmación de eliminación (inline en el banner) */}
            {showDeleteConfirm && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/55 backdrop-blur-[2px]">
                <div className="mx-4 flex max-w-xs flex-col gap-3 rounded-xl border border-white/20 bg-black/70 p-5 text-white shadow-xl">
                  <p className="text-sm font-semibold">¿Eliminar portada?</p>
                  <p className="text-xs text-white/70">
                    Se eliminará tu imagen personalizada y el perfil volverá a utilizar su estilo visual predeterminado.
                  </p>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="rounded-lg border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-white/20"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteBanner}
                      className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-red-700"
                    >
                      Eliminar portada
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Overlay adicional (ej: "Editar perfil" desde ProfileHeader) */}
        {children}
      </div>

      {/* Crop Dialog — fuera del banner para no quedar dentro de overflow-hidden */}
      {pendingCropSrc && (
        <ImageCropDialog
          open={!!pendingCropSrc}
          imageUrl={pendingCropSrc}
          aspect={BANNER_ASPECT_RATIO}
          outputWidth={BANNER_OUTPUT_WIDTH}
          outputHeight={BANNER_OUTPUT_HEIGHT}
          title="Ajustar portada"
          description="Mueve y ajusta la imagen. Lo que quede dentro del recuadro será tu portada."
          onCancel={handleCropCancel}
          onConfirm={handleCropConfirm}
        />
      )}
    </>
  );
}
