"use client";

import { useState } from "react";
import { ImagePlus, Loader2, UserPlus, X } from "lucide-react";
import { notify } from "@/presentation/shared/lib/notify";
import { useAuth } from "@/app/store/auth/AuthContext";
import { uploadToGoogleStorage } from "@/presentation/events/lib/upload/uploadToGoogleStorage";
import type { ExternalProfileType } from "@/domain/entities/studio/Studio";
import {
  createExternalProfileAction,
  type CreatedExternal,
} from "@/app/actions/events/create-external-profile.action";

export const EXTERNAL_TYPE_LABEL: Record<ExternalProfileType, string> = {
  producer: "Productora",
  artist: "Artista",
  venue: "Lugar",
  person: "Persona",
};

/**
 * Formulario de creación de perfil externo (cara sin login). Reutilizado por el
 * hub de colaboradores (sin `eventId`, solo lo agrega a la red) y por el editor
 * de evento (con `eventId`, además lo acredita). Llama a `onCreated` al terminar.
 */
export function ExternalProfileForm({
  eventId,
  onCreated,
  onCancel,
  defaultName = "",
}: {
  eventId?: string;
  onCreated: (ext: CreatedExternal) => void;
  onCancel?: () => void;
  defaultName?: string;
}) {
  const { user } = useAuth();
  const [name, setName] = useState(defaultName);
  const [type, setType] = useState<ExternalProfileType>("artist");
  const [bio, setBio] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [socials, setSocials] = useState({ instagram: "", facebook: "", tiktok: "", website: "" });
  const [creating, setCreating] = useState(false);

  const SOCIALS = [
    { key: "instagram" as const, placeholder: "Instagram (@usuario o URL)" },
    { key: "facebook" as const, placeholder: "Facebook (URL)" },
    { key: "tiktok" as const, placeholder: "TikTok (@usuario o URL)" },
    { key: "website" as const, placeholder: "Sitio web (URL)" },
  ];

  const handleCreate = async () => {
    if (!name.trim()) {
      notify.error("El nombre es obligatorio.");
      return;
    }
    setCreating(true);

    // Sube la imagen directo a GCS por signed URL (evita el límite de peso del
    // server action). Va a public/profile/{uid}/avatar/ con cache-control largo.
    let photoURL: string | undefined;
    if (file) {
      try {
        const { publicUrl } = await uploadToGoogleStorage(file, "profile", user?.uid ?? "external", {
          fileName: "external-avatar",
          contentType: file.type,
          isPublic: true,
          subFolder: "avatar",
          cacheControl: "public, max-age=31536000, immutable",
        });
        photoURL = publicUrl;
      } catch {
        setCreating(false);
        notify.error("No se pudo subir la imagen.");
        return;
      }
    }

    const fd = new FormData();
    if (eventId) fd.append("eventId", eventId);
    fd.append("displayName", name.trim());
    fd.append("type", type);
    fd.append("bio", bio.trim());
    if (photoURL) fd.append("photoURL", photoURL);
    SOCIALS.forEach(({ key }) => {
      if (socials[key].trim()) fd.append(key, socials[key].trim());
    });

    const res = await createExternalProfileAction(fd);
    setCreating(false);
    if (!res.success || !res.external) {
      notify.error(res.error ?? "No se pudo crear el perfil externo.");
      return;
    }
    onCreated(res.external);
    setName("");
    setBio("");
    setFile(null);
    setSocials({ instagram: "", facebook: "", tiktok: "", website: "" });
    notify.success(`${res.external.displayName} creado.`);
  };

  return (
    <div className="rounded-2xl border border-[#F4F4F5] bg-white p-5 shadow-card space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#09090B]">Crear perfil externo</p>
          <p className="mt-0.5 text-xs text-[#71717A]">
            Crea un perfil para acreditar a una persona que no tiene cuenta.
          </p>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-[#E4E4E7] text-[#71717A] transition-colors hover:bg-[#FAFAFC]"
            aria-label="Cancelar"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {/* Nombre */}
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nombre a acreditar *"
        className="h-11 w-full rounded-lg border border-[#E4E4E7] bg-white px-3 text-sm text-[#09090B] placeholder:text-[#A1A1AA] outline-none transition-colors focus:border-[#E63946]"
      />

      {/* Tipo + Imagen */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as ExternalProfileType)}
          className="h-11 flex-1 rounded-lg border border-[#E4E4E7] bg-white px-3 text-sm text-[#09090B] outline-none transition-colors focus:border-[#E63946]"
        >
          {(Object.keys(EXTERNAL_TYPE_LABEL) as ExternalProfileType[]).map((t) => (
            <option key={t} value={t}>
              {EXTERNAL_TYPE_LABEL[t]}
            </option>
          ))}
        </select>
        <label className="inline-flex h-11 flex-1 cursor-pointer items-center gap-2 rounded-lg border border-dashed border-[#E4E4E7] px-3 text-sm text-[#71717A] transition-colors hover:border-[#A1A1AA]">
          <ImagePlus className="size-4 shrink-0" />
          <span className="truncate">{file ? file.name : "Imagen (opcional)"}</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>
      </div>

      {/* Bio */}
      <textarea
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        placeholder="Bio (opcional)"
        rows={2}
        className="w-full rounded-lg border border-[#E4E4E7] bg-white px-3 py-2.5 text-sm text-[#09090B] placeholder:text-[#A1A1AA] outline-none transition-colors focus:border-[#E63946] resize-none"
      />

      {/* Redes sociales */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {SOCIALS.map(({ key, placeholder }) => (
          <input
            key={key}
            type="text"
            value={socials[key]}
            onChange={(e) => setSocials((prev) => ({ ...prev, [key]: e.target.value }))}
            placeholder={placeholder}
            className="h-10 w-full rounded-lg border border-[#E4E4E7] bg-white px-3 text-sm text-[#09090B] placeholder:text-[#A1A1AA] outline-none transition-colors focus:border-[#E63946]"
          />
        ))}
      </div>

      {/* Acción */}
      <button
        type="button"
        onClick={() => void handleCreate()}
        disabled={creating || !name.trim()}
        className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#E63946] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#9B0A26] disabled:opacity-50 shadow-primary-glow"
      >
        {creating ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
        Crear{eventId ? " y acreditar" : ""}
      </button>
    </div>
  );
}
