"use client";

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
    <div className="rounded-2xl border border-[#F4F4F5] bg-white p-5 shadow-card space-y-6">
      {/* Categoría */}
      <div>
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
        <p className="mt-2 text-xs text-[#71717A]">
          Solo una. Si dudas entre dos, elige la principal y usa la otra como etiqueta.
        </p>
      </div>

      <div className="border-t border-[#F4F4F5]" />

      {/* Etiquetas */}
      <Controller
        name="categoryInfo.tags"
        control={form.control}
        render={({ field }) => (
          <TagInput tags={field.value ?? []} setValue={form.setValue} />
        )}
      />
    </div>
  );
};
