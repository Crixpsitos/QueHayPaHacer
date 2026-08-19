"use client"

import { Input } from "@/app/components/ui/input";
import { FormField } from "../form/RegistrationFormBuilder";
import { Textarea } from "@/app/components/ui/textarea";
import { Paperclip } from "lucide-react";

export function FieldPreview({ field }: { field: FormField }) {
  switch (field.type) {
    case "text":
    case "email":
    case "phone":
    case "number":
      return (
        <Input
          type={field.type === "phone" ? "tel" : field.type}
          placeholder={field.placeholder || field.label}
          disabled
          className="h-10 text-sm opacity-60"
        />
      );
    case "textarea":
      return (
        <Textarea
          placeholder={field.placeholder || field.label}
          disabled
          rows={3}
          className="resize-none text-sm opacity-60"
        />
      );
    case "select":
      return (
        <select
          disabled
          className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-500 opacity-60"
        >
          <option>{field.options?.[0] || "Select an option"}</option>
        </select>
      );
    case "radio":
      return (
        <div className="space-y-2 opacity-60">
          {(field.options || []).map((option, i) => (
            <label key={i} className="flex items-center gap-2 text-sm">
              <input type="radio" disabled name={field.id} className="h-4 w-4" />
              {option}
            </label>
          ))}
        </div>
      );
    case "checkbox":
      return (
        <div className="space-y-2 opacity-60">
          {(field.options || []).map((option, i) => (
            <label key={i} className="flex items-center gap-2 text-sm">
              <input type="checkbox" disabled className="h-4 w-4" />
              {option}
            </label>
          ))}
        </div>
      );
    case "date":
      return (
        <Input type="date" disabled className="h-10 text-sm opacity-60" />
      );
    case "file":
      return (
        <div className="flex h-10 items-center gap-2 rounded-md border border-gray-300 bg-gray-50 px-3 text-sm text-gray-500 opacity-60">
          <Paperclip className="h-4 w-4" />
          Elige un archivo
        </div>
      );
    default:
      return null;
  }
}
