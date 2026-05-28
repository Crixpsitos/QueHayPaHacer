"use client";

import { FieldGroup } from "@/app/components/ui/field";
import { type FormEventDto } from "@/application/dto/events/EventDto";
import { Controller, type UseFormReturn } from "react-hook-form";
import { SelectCategories } from "../ui/SelectCategories";
import { Suspense, useState } from "react";
import { Categories } from "@/domain/entities/categories/Categories";
import { TagInput } from "../ui/TagInput";
import { SelectCategoriesSkeleton } from "../ui/SelectCategoriesSkeleton";

interface Step3Props {
  form: UseFormReturn<FormEventDto>;
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

  return (
    <div className=" space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight text-gray-900">
          Clasificación
        </h2>
        <p className="text-sm text-gray-500">
          Empecemos a categorizar tu evento para que sea más fácil de encontrar
          por los usuarios. No te preocupes, siempre podrás cambiarlo después.
        </p>
      </div>

      <FieldGroup>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Controller
            name="categoryInfo"
            control={form.control}
            render={({ field, fieldState }) => (
              <Suspense fallback={<SelectCategoriesSkeleton />}>
                <SelectCategories
                  fieldValue={{
                    id: field.value?.id ?? "",
                    title: field.value?.title ?? "",
                    slug: field.value?.slug ?? "",
                    tags: field.value?.tags,
                  }}
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
            render={({ field }) => (
              <TagInput tags={field.value ?? []} setValue={form.setValue} />
            )}
          />
        </div>
      </FieldGroup>
    </div>
  );
};
