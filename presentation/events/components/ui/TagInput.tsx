"use client";

import { Tag, X, Plus } from "lucide-react";
import { type FormEventDto } from "@/application/dto/events/EventDto";
import { type KeyboardEvent, useState, useMemo } from "react";
import { type UseFormSetValue } from "react-hook-form";
import { cn } from "@/app/lib/utils/cn";

const MAX_TAGS = 8;
const SUGGESTION_COUNT = 6;

export const TAG_CATALOG: string[] = [
  "al aire libre", "bajo techo", "gratis", "entrada libre", "económico",
  "bajo costo", "pet friendly", "mascotas", "familiar", "para niños",
  "para adultos", "para mayores", "para jóvenes", "para parejas", "para dos",
  "romántico", "amigos", "en grupo", "solo", "comunidad",
  "cultural", "arte", "música", "gastronomía", "comida",
  "café", "naturaleza", "aventura", "deporte", "ejercicio",
  "senderismo", "caminata", "bicicleta", "fotografía", "historia",
  "patrimonio", "turismo", "local", "tradicional", "artesanal",
  "nocturno", "de día", "temprano", "tranquilo", "relajado",
  "cerca", "accesible", "informal", "fin de semana", "domingo",
  "sábado", "después del trabajo", "vacaciones", "temporada", "recomendado",
  "popular", "nuevo", "imperdible", "primera cita", "cita",
  "celebración", "cumpleaños", "reunión", "trabajo", "networking",
  "bienestar", "descanso", "saludable", "comida típica", "comida rápida",
  "postres", "desayuno", "almuerzo", "cena", "tarde",
  "noche", "plan tranquilo", "plan rápido", "plan largo", "parque",
  "plaza", "centro", "rural", "urbano", "mercado",
  "feria", "festival", "entretenimiento", "diversión", "aprendizaje",
  "talleres", "creativo", "emprendimiento", "negocios", "montaña",
  "río", "lago", "teatro", "cine", "exposición",
  "museo", "galería", "concierto", "baile", "danza",
  "yoga", "meditación", "spa", "fitness", "running",
  "maratón", "torneo", "competencia", "show", "charla",
  "conferencia", "clase", "degustación", "cata", "cocina",
  "mercado artesanal", "pop up", "inauguración", "lanzamiento", "premiación",
  "espectáculo", "stand up", "humor", "lectura", "literatura",
  "videojuegos", "tecnología", "innovación", "startups", "diseño",
  "moda", "wellness", "mindfulness", "voluntariado", "sostenibilidad",
  "vegano", "vegetariano", "orgánico", "sin gluten", "playa",
];

function pickRandom(catalog: string[], exclude: string[], count: number): string[] {
  const lower = exclude.map((t) => t.toLowerCase());
  const available = catalog.filter((t) => !lower.includes(t.toLowerCase()));
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

interface TagInputProps {
  tags: string[];
  setValue: UseFormSetValue<FormEventDto>;
}

export const TagInput = ({ tags, setValue }: TagInputProps) => {
  const [tagInput, setTagInput] = useState("");
  // Selección aleatoria estable: se fija al montar el componente, no cambia en cada render
  const [baseSuggestions] = useState<string[]>(() =>
    pickRandom(TAG_CATALOG, tags, SUGGESTION_COUNT),
  );

  // Excluye tags ya seleccionados de las sugerencias visibles
  const suggestions = useMemo(() => {
    const lower = tags.map((t) => t.toLowerCase());
    return baseSuggestions.filter((s) => !lower.includes(s.toLowerCase()));
  }, [tags, baseSuggestions]);

  const addTag = (raw: string) => {
    const trimmed = raw.trim().toLowerCase();
    if (!trimmed || tags.length >= MAX_TAGS) return;
    if (tags.map((t) => t.toLowerCase()).includes(trimmed)) return;
    setValue("categoryInfo.tags", [...tags, trimmed], { shouldValidate: true });
    setTagInput("");
  };

  const removeTag = (tagToRemove: string) => {
    setValue("categoryInfo.tags", tags.filter((t) => t !== tagToRemove), {
      shouldValidate: true,
    });
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag(tagInput);
    }
  };

  const atLimit = tags.length >= MAX_TAGS;

  return (
    <div>
      {/* Label + contador */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-[#09090B]">Etiquetas</span>
        <span className={cn("text-xs font-semibold tabular-nums", atLimit ? "text-[#E63946]" : "text-[#71717A]")}>
          {tags.length}/{MAX_TAGS}
        </span>
      </div>

      {/* Input */}
      <div className={cn(
        "flex h-14 items-center gap-2.5 rounded-lg border px-3 transition-colors",
        atLimit
          ? "border-[#F4F4F5] bg-[#F4F4F5] cursor-not-allowed"
          : "border-[#E4E4E7] bg-white focus-within:border-[#E63946] focus-within:ring-1 focus-within:ring-[#E63946]/20",
      )}>
        <Tag className="size-4 shrink-0 text-[#A1A1AA]" />
        <input
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={atLimit ? "Límite de 8 etiquetas alcanzado" : "Escribe y pulsa Enter"}
          disabled={atLimit}
          className="flex-1 bg-transparent text-sm text-[#09090B] placeholder:text-[#A1A1AA] outline-none disabled:cursor-not-allowed"
          aria-label="Añadir etiqueta"
        />
      </div>

      {/* Chips de etiquetas seleccionadas */}
      {tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1.5 rounded-full border border-[#E4E4E7] bg-[#F4F4F5] px-3 py-1 text-xs font-medium text-[#09090B]"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                aria-label={`Eliminar etiqueta ${tag}`}
                className="rounded-full p-0.5 transition-colors hover:bg-[#E4E4E7] hover:text-[#E63946]"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Sugerencias rápidas */}
      {suggestions.length > 0 && !atLimit && (
        <div className="mt-4">
          <p className="mb-2 text-xs text-[#71717A]">Sugerencias rápidas:</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => addTag(suggestion)}
                className="flex items-center gap-1 rounded-full border border-dashed border-[#E4E4E7] bg-white px-3 py-1 text-xs text-[#71717A] transition-colors hover:border-[#E63946] hover:text-[#E63946] active:scale-95"
              >
                <Plus className="size-3 shrink-0" />
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};


interface TagInputProps {
  tags: string[];
  setValue: UseFormSetValue<FormEventDto>;
}
