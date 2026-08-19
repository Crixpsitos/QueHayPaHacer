"use client"

import { useSortable } from "@dnd-kit/sortable";
import { FormField } from "../form/RegistrationFormBuilder";
import { CSS } from "@dnd-kit/utilities";
import { FieldCard } from "./FieldCard";

export interface FieldCardProps {
  field: FormField;
  onUpdate: (updates: Partial<FormField>) => void;
  onRemove: () => void;
  isDragging?: boolean;
}

export function SortableFieldCard({ field, onUpdate, onRemove }: FieldCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <FieldCard
        field={field}
        onUpdate={onUpdate}
        onRemove={onRemove}
        isDragging={isDragging}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}