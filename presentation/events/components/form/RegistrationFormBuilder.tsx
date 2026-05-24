"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  Type,
  AlignLeft,
  Hash,
  AtSign,
  Phone,
  ListFilter,
  Circle,
  CheckSquare,
  Calendar,
  Paperclip,
  FileText,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import { SortableFieldCard } from "../ui/SortableFieldCard";
import { FieldCard } from "../ui/FieldCard";
import { RenderRegistrationForm } from "./RenderRegistrationForm";

type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "email"
  | "phone"
  | "select"
  | "radio"
  | "checkbox"
  | "date"
  | "file";

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
}

interface RegistrationFormSchema {
  fields: FormField[];
}

interface RegistrationFormBuilderProps {
  value: RegistrationFormSchema | Record<string, unknown>;
  onChange: (value: RegistrationFormSchema) => void;
}

const FIELD_TYPES: { type: FieldType; label: string; icon: React.ReactNode }[] =
  [
    { type: "text", label: "Texto", icon: <Type className="h-4 w-4" /> },
    {
      type: "textarea",
      label: "Área de texto",
      icon: <AlignLeft className="h-4 w-4" />,
    },
    { type: "number", label: "Número", icon: <Hash className="h-4 w-4" /> },
    {
      type: "email",
      label: "Correo electrónico",
      icon: <AtSign className="h-4 w-4" />,
    },
    { type: "phone", label: "Teléfono", icon: <Phone className="h-4 w-4" /> },
    {
      type: "select",
      label: "Desplegable",
      icon: <ListFilter className="h-4 w-4" />,
    },
    {
      type: "radio",
      label: "Opción múltiple",
      icon: <Circle className="h-4 w-4" />,
    },
    {
      type: "checkbox",
      label: "Casilla de verificación",
      icon: <CheckSquare className="h-4 w-4" />,
    },
    { type: "date", label: "Fecha", icon: <Calendar className="h-4 w-4" /> },
    { type: "file", label: "Archivo", icon: <Paperclip className="h-4 w-4" /> },
  ];

const MAX_FIELDS = 10;

function normalizeValue(
  value: RegistrationFormSchema | Record<string, unknown>,
): RegistrationFormSchema {
  if (value && "fields" in value && Array.isArray(value.fields)) {
    return value as RegistrationFormSchema;
  }
  return { fields: [] };
}

export const RegistrationFormBuilder = ({
  value,
  onChange,
}: RegistrationFormBuilderProps) => {
  const schema = normalizeValue(value);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const addField = useCallback(
    (type: FieldType) => {
      if (schema.fields.length >= MAX_FIELDS) {
        toast.error(`Máximo de ${MAX_FIELDS} campos alcanzado`);
        return;
      }
      const newField: FormField = {
        id: crypto.randomUUID(),
        type,
        label: `Nuevo campo de ${type}`,
        required: false,
        ...(["text", "textarea", "number", "email", "phone"].includes(type) && {
          placeholder: "",
        }),
        ...(["select", "radio", "checkbox"].includes(type) && {
          options: ["Opción 1", "Opción 2"],
        }),
      };
      onChange({ fields: [...schema.fields, newField] });
    },
    [schema.fields, onChange],
  );

  const updateField = useCallback(
    (id: string, updates: Partial<FormField>) => {
      onChange({
        fields: schema.fields.map((f) =>
          f.id === id ? { ...f, ...updates } : f,
        ),
      });
    },
    [schema.fields, onChange],
  );

  const removeField = useCallback(
    (id: string) => {
      onChange({ fields: schema.fields.filter((f) => f.id !== id) });
    },
    [schema.fields, onChange],
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = schema.fields.findIndex((f) => f.id === active.id);
      const newIndex = schema.fields.findIndex((f) => f.id === over.id);
      onChange({ fields: arrayMove(schema.fields, oldIndex, newIndex) });
    }
  };

  const activeField = activeId
    ? schema.fields.find((f) => f.id === activeId)
    : null;
  const isMaxFieldsReached = schema.fields.length >= MAX_FIELDS;

  return (
    <div className="flex flex-col rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 p-4 bg-gray-50/50 rounded-t-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Formulario de registro personalizado
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {showPreview 
                ? "Visualiza cómo verán los usuarios el formulario de inscripción." 
                : "Diseña los campos que deberán rellenar los asistentes."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors self-start sm:self-center"
          >
            {showPreview ? (
              <>
                <EyeOff className="h-3.5 w-3.5" />
                <span>Modo editor</span>
              </>
            ) : (
              <>
                <Eye className="h-3.5 w-3.5" />
                <span>Vista previa</span>
              </>
            )}
          </button>
        </div>

        {!showPreview && (
          <div className="flex flex-wrap gap-2">
            {FIELD_TYPES.map(({ type, label, icon }) => (
              <button
                key={type}
                type="button"
                onClick={() => addField(type)}
                disabled={isMaxFieldsReached}
                title={
                  isMaxFieldsReached
                    ? "Máximo de campos alcanzado"
                    : `Agregar campo ${label}`
                }
                className="flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
              >
                {icon}
                <span>{label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="min-h-[450px] p-6 bg-gray-50/30">
        {showPreview ? (
          <RenderRegistrationForm schema={schema} />
        ) : schema.fields.length === 0 ? (
          <div className="flex min-h-[350px] items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-white p-12 text-center">
            <div className="max-w-sm">
              <FileText className="mx-auto mb-4 h-10 w-10 text-gray-400 stroke-[1.5]" />
              <h4 className="text-sm font-medium text-gray-900">Formulario vacío</h4>
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                Selecciona los botones de la parte superior para configurar los datos informativos que deseas recolectar en el evento.
              </p>
            </div>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={schema.fields.map((f) => f.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4 max-w-3xl mx-auto">
                {schema.fields.map((field) => (
                  <SortableFieldCard
                    key={field.id}
                    field={field}
                    onUpdate={(updates) => updateField(field.id, updates)}
                    onRemove={() => removeField(field.id)}
                  />
                ))}
              </div>
            </SortableContext>
            <DragOverlay>
              {activeField && (
                <div className="shadow-xl rounded-lg opacity-95">
                  <FieldCard
                    field={activeField}
                    onUpdate={() => {}}
                    onRemove={() => {}}
                    isDragging
                  />
                </div>
              )}
            </DragOverlay>
          </DndContext>
        )}
      </div>
    </div>
  );
};