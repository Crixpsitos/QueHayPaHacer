"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { type RefCallBack } from "react-hook-form";
import { useVirtualizer } from "@tanstack/react-virtual";
import Fuse from "fuse.js";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/app/lib/utils/cn";
import { Field, FieldDescription, FieldLabel } from "@/app/components/ui/field";
import { Button } from "@/app/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/app/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";

interface SelectLocationProps<T> {
  label: string;
  description: string;
  options: T[];
  value: string;
  invalid: boolean;
  onChange: (value: string) => void;
  getValue: (option: T) => string;
  getLabel: (option: T) => string;
  disabled?: boolean;
  onBlur: () => void;
  error?: string;
  ref: RefCallBack;
}

export const SelectLocation = <T,>({
  label,
  description,
  options,
  value,
  invalid,
  onChange,
  disabled = false,
  onBlur,
  error,
  getValue,
  getLabel,
  ref,
}: SelectLocationProps<T>) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
const [scrollElement, setScrollElement] = useState<HTMLDivElement | null>(null);

  const selectedItem = options.find((item) => getValue(item) === value);

  const filteredOptions = useMemo(() => {
    if (!search) return options;

    const formattedOptions = options.map((opt) => ({
      label: getLabel(opt),
      original: opt,
    }));

    const fuse = new Fuse(formattedOptions, {
      keys: ["label"], 
      threshold: 0.35,
      isCaseSensitive: false,
    });

    return fuse.search(search).map((result) => result.item.original);
  }, [options, search, getLabel]);

  const rowVirtualizer = useVirtualizer({
    count: filteredOptions.length,
    getScrollElement: () => scrollElement,
    estimateSize: () => 35,
    overscan: 5,
  });

  useEffect(() => {
    rowVirtualizer.scrollToOffset(0);
  }, [options, search, rowVirtualizer]);

  return (
    <Field data-invalid={invalid}>
      <FieldLabel>{label}</FieldLabel>
      <FieldDescription>{description}</FieldDescription>
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            disabled={disabled}
            onBlur={onBlur}
            ref={ref} 
            aria-expanded={open}
            className={cn(
              "w-full justify-between font-normal text-left",
              !value && "text-muted-foreground",
              error && "border-destructive focus-visible:ring-destructive",
            )}
          >
            {selectedItem
              ? getLabel(selectedItem)
              : `Seleccionar ${label.toLowerCase()}...`}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0"
          align="start"
        >
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={`Buscar ${label.toLowerCase()}...`}
              value={search}
              onValueChange={setSearch}
            />

            <CommandList
              ref={setScrollElement}
              className="max-h-[200px] overflow-y-auto relative"
            >
              {filteredOptions.length === 0 && (
                <CommandEmpty className="p-4 text-sm text-center">
                  No se encontraron resultados.
                </CommandEmpty>
              )}

              <div
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                  width: "100%",
                  position: "relative",
                }}
              >
                {rowVirtualizer.getVirtualItems().map((virtualItem) => {
           

                  const option = filteredOptions[virtualItem.index];
                 
                  
                  // Si por alguna razón el índice es indefinido en renderizados veloces, prevenimos crasheo
                  if (!option) return null;

                  const itemValue = getValue(option);
                  const itemLabel = getLabel(option);

                  return (
                    <CommandItem
                      key={itemValue}
                      value={itemValue}
                      onSelect={() => {
                        onChange(itemValue);
                        setOpen(false);
                        setSearch(""); // Limpiamos buscador al elegir
                      }}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: `${virtualItem.size}px`,
                        transform: `translateY(${virtualItem.start}px)`,
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === itemValue ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <span className="truncate">{itemLabel}</span>
                    </CommandItem>
                  );
                })}
              </div>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      {invalid && <FieldLabel className="text-destructive mt-1">{error}</FieldLabel>}
    </Field>
  );
};