"use client";

import { useMemo, useState, useEffect } from "react";
import { type RefCallBack } from "react-hook-form";
import { useVirtualizer } from "@tanstack/react-virtual";
import Fuse from "fuse.js";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/app/lib/utils/cn";
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

interface SelectCurrencyProps<T> {
  options: T[];
  value: string;
  invalid: boolean;
  onChange: (value: string) => void;
  getValue: (option: T) => string;
  getLabel: (option: T) => string;
  getDisabled?: (option: T) => boolean;
  disabled?: boolean;
  onBlur: () => void;
  placeholder?: string;
  ref: RefCallBack;
}

export const SelectCurrency = <T,>({
  options,
  value,
  invalid,
  onChange,
  disabled = false,
  onBlur,
  placeholder = "Seleccionar moneda...",
  getValue,
  getLabel,
  getDisabled,
  ref,
}: SelectCurrencyProps<T>) => {
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
    estimateSize: () => 38,
    overscan: 5,
  });

  useEffect(() => {
    rowVirtualizer.scrollToOffset(0);
  }, [search, rowVirtualizer]);

  return (
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
            "h-10 w-full justify-between font-normal text-left px-3 py-2 border border-gray-300 rounded-lg bg-background text-sm shadow-sm transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black focus-visible:border-black",
            !value && "text-muted-foreground",
            invalid && "border-destructive focus-visible:ring-destructive focus-visible:border-destructive"
          )}
        >
          <span className="truncate">
            {selectedItem ? getLabel(selectedItem) : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0 rounded-lg shadow-md border border-gray-200"
        align="start"
      >
        <Command shouldFilter={false} className="rounded-lg">
          <CommandInput
            placeholder="Buscar moneda..."
            value={search}
            onValueChange={setSearch}
            className="h-9 text-sm focus:ring-0 focus:border-0 border-none"
          />

          <CommandList
            ref={setScrollElement}
            className="max-h-[220px] overflow-y-auto relative scrollbar-thin"
          >
            {filteredOptions.length === 0 && (
              <CommandEmpty className="p-4 text-xs text-center text-gray-500">
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

                if (!option) return null;

                const itemValue = getValue(option);
                const itemLabel = getLabel(option);
                const isItemDisabled = getDisabled ? getDisabled(option) : false;

                return (
                  <CommandItem
                    key={itemValue}
                    value={itemValue}
                    disabled={isItemDisabled}
                    onSelect={() => {
                      if (isItemDisabled) return;
                      onChange(itemValue);
                      setOpen(false);
                      setSearch("");
                    }}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: `${virtualItem.size}px`,
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                    className={cn(
                      "flex items-center px-3 py-2 text-xs cursor-pointer select-none rounded-md transition-colors",
                      isItemDisabled && "cursor-not-allowed opacity-40 hover:bg-transparent text-gray-400 select-none pointer-events-auto"
                    )}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-3.5 w-3.5 shrink-0",
                        value === itemValue ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="truncate font-medium">{itemLabel}</span>
                  </CommandItem>
                );
              })}
            </div>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};