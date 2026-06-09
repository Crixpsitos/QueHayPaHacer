"use client";

import React, { useMemo } from "react";
import { useForm, FormProvider, Controller } from "react-hook-form";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { Field, FieldGroup, FieldLabel, FieldError } from "@/app/components/ui/field";
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
import { generateDynamicValibotSchema, FormField } from "@/presentation/events/lib/schemas/dynamicSchema";
import { Button } from "@/app/components/ui/button";

interface RegistrationFormSchema {
  fields: FormField[];
}


interface RenderRegistrationFormProps {
  schema: RegistrationFormSchema;
  isPreview?: boolean;
  onSubmit?: (data: Record<string, unknown>) => void;
}

export function RenderRegistrationForm({
  schema,
  isPreview = true,
  onSubmit,
}: RenderRegistrationFormProps) {
  const dynamicSchema = useMemo(() => {
    if (isPreview) return null;
    return generateDynamicValibotSchema(schema.fields);
  }, [schema.fields, isPreview]);

  const defaultValues = useMemo(() => {
    const defaults: Record<string, string | string[]> = {};
    schema.fields.forEach((field) => {
      defaults[field.id] = field.type === "checkbox" ? [] : "";
    });
    return defaults;
  }, [schema.fields]);

  const localForm = useForm({
    resolver: dynamicSchema ? valibotResolver(dynamicSchema) : undefined,
    defaultValues,
    mode: "onChange",
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderInputField = (field: FormField, formProps?: { value: any; onChange: (v: any) => void }) => {
    const value = formProps ? formProps.value : "";
    const onChange = formProps ? formProps.onChange : () => {};

    switch (field.type) {
      case "text":
        return (
          <Input
            value={value}
            onChange={onChange}
            placeholder={field.placeholder || "Ingresa tu respuesta..."}
            className="h-10 text-sm bg-background border-input"
          />
        );
      case "textarea":
        return (
          <Textarea
            value={value}
            onChange={onChange}
            placeholder={field.placeholder || "Escribe aquí en detalle..."}
            className="min-h-[80px] text-sm bg-background border-input"
          />
        );
      case "number":
        return (
          <Input
            type="number"
            value={value}
            onChange={onChange}
            placeholder={field.placeholder || "0"}
            className="h-10 text-sm bg-background border-input"
          />
        );
      case "email":
        return (
          <Input
            type="email"
            value={value}
            onChange={onChange}
            placeholder={field.placeholder || "ejemplo@correo.com"}
            className="h-10 text-sm bg-background border-input"
          />
        );
      case "phone":
        return (
          <Input
            type="tel"
            value={value}
            onChange={onChange}
            placeholder={field.placeholder || "Número de contacto"}
            className="h-10 text-sm bg-background border-input"
          />
        );
case "select":
        return (
          <Select value={typeof value === "string" ? value : ""} onValueChange={onChange}>
            <SelectTrigger className="h-10 w-full bg-background border-input">
              <SelectValue placeholder={field.placeholder || "Selecciona una opción"} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {field.options?.map((option, index) => {
                  const itemKey = `${field.id}-select-option-${index}`;
                  return (
                    <SelectItem key={itemKey} value={`${option}__${index}`}>
                      {option}
                    </SelectItem>
                  );
                })}
              </SelectGroup>
            </SelectContent>
          </Select>
        );
      case "radio":
        return (
          <RadioGroup 
            value={typeof value === "string" ? value : ""} 
            onValueChange={onChange} 
            className="flex flex-col gap-2 mt-1"
          >
            {field.options?.map((option, index) => {
              const optionId = `${field.id}-radio-${index}`;
              return (
                <div key={optionId} className="flex items-center gap-2.5">
                  <RadioGroupItem value={`${option}__${index}`} id={optionId} />
                  <Label htmlFor={optionId} className="text-sm font-normal text-gray-700 cursor-pointer">
                    {option}
                  </Label>
                </div>
              );
            })}
          </RadioGroup>
        );
      case "checkbox":
        const currentChecked = Array.isArray(value) ? value : [];
        return (
          <div className="flex flex-col gap-2 mt-1">
            {field.options?.map((option, index) => {
              const optionId = `${field.id}-checkbox-${index}`;
              const itemValue = `${option}__${index}`;
              const isChecked = currentChecked.includes(itemValue);
              return (
                <div key={optionId} className="flex items-center gap-2.5">
                  <Checkbox
                    id={optionId}
                    checked={isChecked}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        onChange([...currentChecked, itemValue]);
                      } else {
                        onChange(currentChecked.filter((item) => item !== itemValue));
                      }
                    }}
                  />
                  <Label htmlFor={optionId} className="text-sm font-normal text-gray-700 cursor-pointer select-none">
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
            value={value}
            onChange={onChange}
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
              <input
                type="file"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    onChange(e.target.files[0]);
                  }
                }}
              />
            </label>
          </div>
        );
      default:
        return null;
    }
  };

  const renderFieldsContent = () => (
    <FieldGroup>
      <div className="grid grid-cols-1 gap-5">
        {schema.fields.map((field) => (
          <React.Fragment key={field.id}>
            {isPreview ? (
              <Field className="w-full">
                <FieldLabel className="text-xs font-semibold text-gray-700 mb-1.5 block">
                  {field.label}
                  {field.required && <span className="text-red-500 font-bold ml-0.5">*</span>}
                </FieldLabel>
                <div className="w-full">{renderInputField(field)}</div>
              </Field>
            ) : (
              <Controller
                name={field.id}
                control={localForm.control}
                render={({ field: formField, fieldState }) => (
                  <Field className="w-full" data-invalid={fieldState.invalid.toString()}>
                    <FieldLabel className="text-xs font-semibold text-gray-700 mb-1.5 block">
                      {field.label}
                      {field.required && <span className="text-red-500 font-bold ml-0.5">*</span>}
                    </FieldLabel>
                    <div className="w-full">{renderInputField(field, formField)}</div>
                    {fieldState.invalid && <FieldError>{fieldState.error?.message}</FieldError>}
                  </Field>
                )}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </FieldGroup>
  );

  return (
    <div className="w-full bg-white rounded-lg border border-gray-200 shadow-sm max-w-3xl mx-auto">
      <div className="border-b border-gray-100 px-6 py-4 bg-gray-50/50 rounded-t-lg">
        <h4 className="text-sm font-semibold text-gray-800">Formulario de Inscripción</h4>
      </div>

      <div className="p-6">
        {schema.fields.length === 0 ? (
          <div className="flex min-h-[250px] items-center justify-center rounded-xl border-2 border-dashed border-gray-100 p-8 text-center bg-white">
            <div className="max-w-xs">
              <FileWarning className="mx-auto mb-3 h-8 w-8 text-gray-300 stroke-[1.5]" />
              <p className="text-xs text-gray-400 leading-relaxed">
                No hay campos configurados para mostrar. Regresa al modo editor para agregar preguntas personalizadas.
              </p>
            </div>
          </div>
        ) : isPreview ? (
          <div className="space-y-5">{renderFieldsContent()}</div>
        ) : (
          <FormProvider {...localForm}>
            <form
              onSubmit={localForm.handleSubmit(
                onSubmit
                  ? (data) => onSubmit(data)
                  : () => {}
              )}
              className="space-y-5"
            >
              {renderFieldsContent()}
              <div className="flex justify-end pt-4">
                <Button type="submit">Enviar inscripción</Button>
              </div>
            </form>
          </FormProvider>
        )}
      </div>
    </div>
  );
}