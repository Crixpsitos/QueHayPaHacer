import { Button } from "@/app/components/ui/button";
import { cn } from "@/app/lib/utils/cn";
import { ImageUp, X } from "lucide-react";
import Image from "next/image";
import { useMemo } from "react";
import { useDropzone } from "react-dropzone";
import { Field, FieldError, FieldLabel } from "@/app/components/ui/field";

interface ImageDropzoneProps {
  value: string | null;
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
  const fileUrl = useMemo(() => {
    if (!value) return null;
    return value;
  }, [value]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/*": [".jpg", ".jpeg", ".png", ".webp", ".gif"],
    },
    maxFiles: 1,
    onDrop: (accepted) => {
      if (accepted[0]) onChange(accepted[0]);
    },
  });

  return (
    <Field
      data-invalid={!!error}
      className="w-full max-w-4xl mx-auto flex flex-col gap-2"
    >
      <FieldLabel>Imagen principal del evento</FieldLabel>

      {value && fileUrl ? (
        <div className="relative group overflow-hidden rounded border border-gray-200 shadow-sm">
          <div className="relative aspect-video w-full">
            <Image
              src={fileUrl}
              alt="Main event image preview"
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
              priority={false}
            />
          </div>

          <Button
            type="button"
            onClick={removeMainImage}
            className="absolute top-2 right-2 rounded-lg border border-gray-300 bg-white/90 p-2 shadow-md backdrop-blur-sm text-gray-700 hover:bg-white hover:text-red-600 transition"
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
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {error && <FieldError errors={[{ message: error } as any]} />}
    </Field>
  );
};
