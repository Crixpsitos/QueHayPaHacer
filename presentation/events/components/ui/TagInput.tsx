"use client";

import { Badge } from "@/app/components/ui/badge";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/app/components/ui/field";
import { Input } from "@/app/components/ui/input";
import { type CreateEventDto } from "@/application/dto/events/EventDto";
import { X } from "lucide-react";
import { type KeyboardEvent, useState } from "react";
import { type UseFormSetValue } from "react-hook-form";

interface TagInputProps {
  tags: string[];
  setValue: UseFormSetValue<CreateEventDto>;
}

export const TagInput = ({ tags, setValue }: TagInputProps) => {
  const [tagInput, setTagInput] = useState("");

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 10) {
      setValue("categoryInfo.tags", [...tags, trimmedTag], {
        shouldValidate: true,
      });
    }
    setTagInput("");
  };

  const removeTag = (tagToRemove: string) => {
    setValue(
      "categoryInfo.tags",
      tags.filter((tag) => tag !== tagToRemove),
      { shouldValidate: true },
    );
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(tagInput);
    }
  };

  return (
    <Field>
      <FieldLabel className="text-sm font-medium text-gray-700">
        Etiquetas <span className="text-gray-400">(max 10)</span>
      </FieldLabel>
      <div className="space-y-3">
        <Input
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe una etiqueta y presiona Enter o coma"
          className="border-gray-300 focus:border-black focus:ring-1 focus:ring-black"
          disabled={tags.length >= 10}
          aria-label="Añadir etiqueta"
        />
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="border border-gray-300 bg-gray-100 text-gray-800 hover:bg-gray-200"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-1 rounded-full hover:bg-gray-300"
                  aria-label={`Remove tag ${tag}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
        <p className="text-xs text-gray-500">{tags.length}/10 tags</p>
      </div>
    </Field>
  );
};
