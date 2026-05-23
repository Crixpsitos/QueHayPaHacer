"use client";
import { FieldGroup } from "@/app/components/ui/field";
import { type CreateEventDto } from "@/application/dto/events/EventDto";
import { Controller, type UseFormReturn } from "react-hook-form";
import { SelectCategories } from "../ui/SelectCategories";
import { Suspense, useState } from "react";
import { Categories } from "@/domain/entities/categories/Categories";
import { TagInput } from "../ui/TagInput";
import { SelectCategoriesSkeleton } from "../ui/SelectCategoriesSkeleton";

interface Step3Props {
  form: UseFormReturn<CreateEventDto>;
}

const getCategories = async () => {
  const response = await fetch("/api/categories", {
    next: {
      tags: ["categories"],
      revalidate: 60,
    },
  });
  return (await response.json()) as Categories[];
};

export const Step3Clasification = ({ form }: Step3Props) => {
  const [categoriesPromise] = useState<Promise<Categories[]>>(() =>
    getCategories(),
  );
  const tags = form.watch("categoryInfo.tags");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-medium text-black">Clasificación</h2>
        <p className="text-sm text-gray-500">
          Empecemos a categorizar tu evento para que sea más fácil de encontrar
          por los usuarios. No te preocupes, siempre podrás cambiarlo después.
        </p>
      </div>
      <FieldGroup>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Controller
            name="categoryInfo"
            control={form.control}
            render={({ field, fieldState }) => (
              <Suspense fallback={<SelectCategoriesSkeleton />}>
                <SelectCategories
                  fieldValue={field.value}
                  fieldState={fieldState}
                  getCategoriesPromise={categoriesPromise}
                  onChange={field.onChange}
                  disabled={field.disabled}
                  onBlur={field.onBlur}
                  ref={field.ref}
                />
              </Suspense>
            )}
          />
          <Controller
            name="categoryInfo.tags"
            control={form.control}
            render={() => (
              <TagInput tags={tags ?? []} setValue={form.setValue} />
            )}
          />
        </div>
      </FieldGroup>
    </div>
  );
};
