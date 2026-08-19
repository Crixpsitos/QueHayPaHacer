import * as v from "valibot";

export interface FormField {
  id: string;
  type: "text" | "textarea" | "number" | "email" | "phone" | "select" | "radio" | "checkbox" | "date" | "file";
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
}

export const generateDynamicValibotSchema = (fields: FormField[]) => {
  const shape: Record<string, v.GenericSchema> = {};

  fields.forEach((field) => {
    if (field.type === "checkbox") {
      const checkboxBase = v.array(v.string());
      shape[field.id] = field.required
        ? v.pipe(checkboxBase, v.minLength(1, "Selecciona al menos una opción"))
        : v.optional(checkboxBase, []);
      return;
    }

    if (field.type === "file") {
      shape[field.id] = field.required 
        ? v.any() 
        : v.optional(v.any());
      return;
    }

    let baseSchema: v.GenericSchema = v.string();
    const rules: v.PipeItem<string, string, v.BaseIssue<unknown>>[] = [];

    if (field.required) {
      rules.push(v.nonEmpty("Este campo es obligatorio"));
    }

    if (field.type === "email") {
      rules.push(v.email("Dirección de correo electrónico inválida"));
    }

    if (rules.length > 0) {
      baseSchema = v.pipe(v.string(), ...rules);
    }

    shape[field.id] = field.required ? baseSchema : v.optional(baseSchema, "");
  });

  return v.object(shape);
};