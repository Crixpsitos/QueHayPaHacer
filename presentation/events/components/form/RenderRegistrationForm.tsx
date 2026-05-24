"use client";

import React from "react";
import { Field, FieldGroup, FieldLabel } from "@/app/components/ui/field";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";
import { Checkbox } from "@/app/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Textarea } from "@/app/components/ui/textarea";
import { FileWarning, UploadCloud } from "lucide-react";

export interface FormField {
  id: string;
  type:
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
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
}

interface RegistrationFormSchema {
  fields: FormField[];
}

interface RenderRegistrationFormProps {
  schema: RegistrationFormSchema;
}

export function RenderRegistrationForm({
  schema,
}: RenderRegistrationFormProps) {
  const renderFormField = (field: FormField) => {
    switch (field.type) {
      case "text":
        return (
          <Input
            placeholder={field.placeholder || "Ingresa tu respuesta..."}
            className="h-10 text-sm bg-background border-input"
          />
        );
      case "textarea":
        return (
          <Textarea
            placeholder={field.placeholder || "Escribe aquí en detalle..."}
            className="min-h-[80px] text-sm bg-background border-input"
          />
        );
      case "number":
        return (
          <Input
            type="number"
            placeholder={field.placeholder || "0"}
            className="h-10 text-sm bg-background border-input"
          />
        );
      case "email":
        return (
          <Input
            type="email"
            placeholder={field.placeholder || "ejemplo@correo.com"}
            className="h-10 text-sm bg-background border-input"
          />
        );
      case "phone":
        return (
          <Input
            type="tel"
            placeholder={field.placeholder || "Número de contacto"}
            className="h-10 text-sm bg-background border-input"
          />
        );
      case "select":
        return (
          <Select>
            <SelectTrigger className="h-10 w-full bg-background border-input">
              <SelectValue
                placeholder={field.placeholder || "Selecciona una opción"}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {field.options?.map((option, index) => (
                  <SelectItem key={`${field.id}-select-${index}`} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        );
      case "radio":
        return (
          <RadioGroup className="flex flex-col gap-2 mt-1">
            {field.options?.map((option, index) => {
              const optionId = `${field.id}-radio-${index}`;
              return (
                <div key={optionId} className="flex items-center gap-2.5">
                  <RadioGroupItem value={option} id={optionId} />
                  <Label
                    htmlFor={optionId}
                    className="text-sm font-normal text-gray-700 cursor-pointer"
                  >
                    {option}
                  </Label>
                </div>
              );
            })}
          </RadioGroup>
        );
      case "checkbox":
        return (
          <div className="flex flex-col gap-2 mt-1">
            {field.options?.map((option, index) => {
              const optionId = `${field.id}-checkbox-${index}`;
              return (
                <div key={optionId} className="flex items-center gap-2.5">
                  <Checkbox id={optionId} />
                  <Label
                    htmlFor={optionId}
                    className="text-sm font-normal text-gray-700 cursor-pointer select-none"
                  >
                    {option}
                  </Label>
                </div>
              );
            })}
          </div>
        );
      case "date":
        return (
          <Input
            type="date"
            className="h-10 text-sm bg-background border-input text-gray-700"
          />
        );
      case "file":
        return (
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
                <UploadCloud className="w-8 h-8 mb-2 text-gray-400" />
                <p className="text-xs text-gray-500 font-medium">
                  {field.placeholder || "Haz clic para cargar o arrastra un archivo"}
                </p>
              </div>
              <input type="file" className="hidden" />
            </label>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full bg-white rounded-lg border border-gray-200 shadow-sm max-w-3xl mx-auto">
      <div className="border-b border-gray-100 px-6 py-4 bg-gray-50/50 rounded-t-lg">
        <h4 className="text-sm font-semibold text-gray-800">
          Formulario de Inscripción
        </h4>
      </div>

      <div className="p-6">
        {schema.fields.length === 0 ? (
          <div className="flex min-h-[250px] items-center justify-center rounded-xl border-2 border-dashed border-gray-100 p-8 text-center bg-white">
            <div className="max-w-xs">
              <FileWarning className="mx-auto mb-3 h-8 w-8 text-gray-300 stroke-[1.5]" />
              <p className="text-xs text-gray-400 leading-relaxed">
                No hay campos configurados para mostrar. Regresa al modo editor para agregar preguntas personalizados.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <FieldGroup>
              <div className="grid grid-cols-1 gap-5">
                {schema.fields.map((field) => (
                  <Field key={field.id} className="w-full">
                    <FieldLabel className="text-xs font-semibold text-gray-700 mb-1.5 block">
                      {field.label}
                      {field.required && (
                        <span className="text-red-500 font-bold ml-0.5">*</span>
                      )}
                    </FieldLabel>
                    <div className="w-full">
                      {renderFormField(field)}
                    </div>
                  </Field>
                ))}
              </div>
            </FieldGroup>
          </div>
        )}
      </div>
    </div>
  );
}