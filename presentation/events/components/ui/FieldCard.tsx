"use client";

import { useState } from "react";
import { FieldCardProps } from "./SortableFieldCard";
import { GripVertical, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Switch } from "@/app/components/ui/switch";
import { Input } from "@/app/components/ui/input";
import { FieldPreview } from "./FieldPreview";

export function FieldCard({
  field,
  onUpdate,
  onRemove,
  isDragging,
  dragHandleProps,
}: FieldCardProps & { dragHandleProps?: Record<string, unknown> }) {
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  
  const [labelValue, setLabelValue] = useState(field.label);
  const [prevLabel, setPrevLabel] = useState(field.label);

  if (field.label !== prevLabel) {
    setLabelValue(field.label);
    setPrevLabel(field.label);
  }

  const isLabelInvalid = field.label.length < 2;
  const hasOptions = ["select", "radio", "checkbox"].includes(field.type);
  const hasPlaceholder = ["text", "textarea", "number", "email", "phone"].includes(field.type);

  const handleLabelBlur = () => {
    setIsEditingLabel(false);
    if (labelValue.trim()) {
      onUpdate({ label: labelValue.trim() });
    } else {
      setLabelValue(field.label);
    }
  };

  const addOption = () => {
    const currentOptions = field.options || [];
    onUpdate({ options: [...currentOptions, `Option ${currentOptions.length + 1}`] });
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...(field.options || [])];
    newOptions[index] = value;
    onUpdate({ options: newOptions });
  };

  const removeOption = (index: number) => {
    const newOptions = (field.options || []).filter((_, i) => i !== index);
    onUpdate({ options: newOptions });
  };

  return (
    <div
      className={`rounded-lg border bg-white p-4 ${
        isDragging
          ? "border-gray-900 ring-1 ring-gray-900"
          : "border-gray-200"
      }`}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="flex-shrink-0 cursor-grab touch-none text-gray-400 hover:text-gray-600"
          {...dragHandleProps}
        >
          <GripVertical className="h-5 w-5" />
        </button>

        <span className="flex-shrink-0 rounded border border-gray-300 bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
          {field.type}
        </span>

        <div className="min-w-0 flex-1">
          {isEditingLabel ? (
            <input
              type="text"
              value={labelValue}
              onChange={(e) => setLabelValue(e.target.value)}
              onBlur={handleLabelBlur}
              onKeyDown={(e) => e.key === "Enter" && handleLabelBlur()}
              className="w-full border-b border-gray-300 bg-transparent text-sm focus:border-black focus:outline-none"
              autoFocus
            />
          ) : (
            <button
              type="button"
              onClick={() => setIsEditingLabel(true)}
              className="flex items-center gap-2 text-left text-sm text-gray-900 hover:underline"
            >
              <span className="truncate">{field.label}</span>
              {isLabelInvalid && (
                <span className="h-2 w-2 flex-shrink-0 rounded-full bg-red-500" />
              )}
            </button>
          )}
        </div>

        <div className="flex flex-shrink-0 items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-gray-500">
            <Switch
              checked={field.required}
              onCheckedChange={(checked) => onUpdate({ required: checked })}
              className="h-4 w-7 data-[state=checked]:bg-black"
            />
            <span>Requerido</span>
          </label>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onRemove();
            }}
            className="h-8 w-8 flex-shrink-0 p-0 text-gray-400 hover:bg-gray-100 hover:text-gray-900"
            aria-label="Delete field"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="mt-4">
        <FieldPreview field={field} />
      </div>

      {hasPlaceholder && (
        <div className="mt-3">
          <Input
            placeholder="Ingresa tu texto aquí..."
            value={field.placeholder || ""}
            onChange={(e) => onUpdate({ placeholder: e.target.value })}
            className="h-9 text-sm"
          />
        </div>
      )}

      {hasOptions && (
        <div className="mt-4 space-y-2">
          {(field.options || []).map((option, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                value={option}
                onChange={(e) => updateOption(index, e.target.value)}
                className="h-9 flex-1 text-sm"
                placeholder={`Option ${index + 1}`}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeOption(index)}
                disabled={(field.options?.length || 0) <= 1}
                className="h-9 w-9 flex-shrink-0 p-0 text-gray-400 hover:text-gray-900 disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <button
            type="button"
            onClick={addOption}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
          >
            <Plus className="h-4 w-4" />
            Agregar opción
          </button>
        </div>
      )}
    </div>
  );
}