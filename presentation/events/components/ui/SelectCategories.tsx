"use client"
import { Field, FieldLabel } from "@/app/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Categories } from "@/domain/entities/categories/Categories";
import { use } from "react";
import { type ControllerFieldState, type RefCallBack } from "react-hook-form";
import { toSlug } from "@/app/lib/utils/slug";

interface SelectCategoriesProps {
  fieldValue: {
    id: string;
    title: string;
    slug: string;
    tags?: string[] | undefined;
};
  fieldState: ControllerFieldState;
  getCategoriesPromise: Promise<Categories[]>;
  onChange: (value:  {id: string, title: string, slug: string, tags: string[]}) => void;
  disabled?: boolean;
  onBlur: () => void;
  ref: RefCallBack;
}

export const SelectCategories = ({
  fieldValue,
  fieldState,
  getCategoriesPromise,
  onChange,
  disabled = false,
  onBlur,
  ref,
}: SelectCategoriesProps) => {
  const categories = use(getCategoriesPromise);

  const currentSelectId =
    typeof fieldValue === "object" && fieldValue ? fieldValue.id : (fieldValue as string) || "";

    const handleValueChange = (id: string) => {
    const categoryFound = categories.find((cat) => cat.id === id);
    
    if (categoryFound) {
      const existingTags = 
        typeof fieldValue === "object" && fieldValue && Array.isArray(fieldValue.tags)
          ? fieldValue.tags
          : [];

      onChange({
        id: categoryFound.id,
        title: categoryFound.title,
        slug: categoryFound?.slug ? categoryFound?.slug : toSlug(categoryFound.title),
        tags: existingTags, 
      });
    }
  };

  return (
    <Field data-invalid={fieldState.invalid}>
      <FieldLabel>Categoria principal</FieldLabel>
      <Select value={currentSelectId} onValueChange={handleValueChange} disabled={disabled}>
        <SelectTrigger onBlur={onBlur} ref={ref}>
          <SelectValue placeholder="Elige una categoría" />
        </SelectTrigger>
        <SelectContent position="popper">
          <SelectGroup>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.title}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
        {fieldState.invalid && <FieldLabel className="text-destructive">Por favor selecciona una categoría</FieldLabel>}
    </Field>
  );
};
