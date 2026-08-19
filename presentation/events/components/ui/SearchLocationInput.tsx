"use client";

import { Input } from "@/app/components/ui/input";
import { Popover, PopoverTrigger, PopoverContent } from "@/app/components/ui/popover";
import { useCallback, useState, useRef, useEffect } from "react";
import { Loader2, MapPin, Search } from "lucide-react";
import { cn } from "@/app/lib/utils/cn";

interface LocationOption {
  id: string;
  name: string;
  subtext: string;
  coordinates: [number, number];
}

interface SearchLocationInputProps {
  cityName?: string;
  cityCoords?: { latitude: number; longitude: number } | null;
  countryIsoCode?: string;
  value?: string;
  disabled?: boolean;
  onChange: (value: string, coords: [number, number], address: string) => void;
}

export interface Root {
  type: string;
  features: Feature[];
}

export interface Feature {
  type: string;
  properties: Properties;
  geometry: Geometry;
}

export interface Properties {
  osm_type: string;
  osm_id: number;
  osm_key: string;
  osm_value: string;
  type: string;
  name: string;
  street: string;
  locality?: string;
  city?: string;
  state: string;
  country: string;
  postcode: string;
  countrycode: string;
  extent: number[] | null;
  county?: string;
  district?: string;
}

export interface Geometry {
  type: string;
  coordinates: number[];
}

export const SearchLocationInput = ({
  cityName,
  cityCoords,
  countryIsoCode,
  value,
  disabled,
  onChange,
}: SearchLocationInputProps) => {
  const [search, setSearch] = useState(value || "");
  const [options, setOptions] = useState<LocationOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    setSearch(value || "");
  }, [value]);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearch(value);

      if (value.trim().length < 3) {
        if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
        setOptions([]);
        setOpen(false);
        setLoading(false);
        setHasSearched(false);
        setHasError(false);
        return;
      }

      setLoading(true);
      setHasError(false);
      setOpen(true);

      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      debounceTimeoutRef.current = setTimeout(async () => {
        try {
          const cleanQuery = cityName ? `${value}, ${cityName}` : value;
          
          let url = `https://photon.komoot.io/api/?q=${encodeURIComponent(cleanQuery)}&limit=5&lang=en`;

          if (countryIsoCode) {
            url += `&countrycode=${countryIsoCode.toLowerCase()}`;
          }

          if (cityCoords?.latitude && cityCoords?.longitude) {
            url += `&lat=${cityCoords.latitude}&lon=${cityCoords.longitude}&zoom=12`;
            url += `&location_bias_scale=1.0`;
          }

          const response = await fetch(url);
          const data = await response.json() as Root;
          
          const formattedOptions = data.features.map((feature: Feature, index: number) => {
            const props = feature.properties;
            
            const mainName = props.name && props.street 
              ? `${props.name} - ${props.street}` 
              : (props.name || props.street || "Lugar desconocido");

            const addressParts = [
              props.street,
              props.district,
              props.county,
              props.city,
              props.state
            ];

            const subDetails = addressParts
              .filter((val) => val && val !== props.name && val !== mainName)
              .filter(Boolean)
              .join(", ");

            const coords = feature.geometry.coordinates;
            const coordinates: [number, number] = [
              typeof coords[0] === 'number' ? coords[0] : 0,
              typeof coords[1] === 'number' ? coords[1] : 0
            ];

            return {
              id: `${props.osm_id}-${index}`,
              name: mainName,
              subtext: subDetails,
              coordinates,
            };
          });

          setOptions(formattedOptions);
          setHasSearched(true);
        } catch (error) {
          console.error("Error fetching places:", error);
          setOptions([]);
          setHasError(true);
          setHasSearched(true);
        } finally {
          setLoading(false);
        }
      }, 400);
    },
    [cityName, cityCoords?.latitude, cityCoords?.longitude, countryIsoCode],
  );

  const handleSelectOption = (option: LocationOption) => {
    setSearch(option.name);
    setOpen(false);
    onChange(option.name, option.coordinates, option.subtext);
  };

  const showDropdown = open && (loading || options.length > 0 || (hasSearched && !loading));

  return (
    <div ref={containerRef} className="w-full relative">
      <Popover open={showDropdown} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative flex items-center w-full">
            <Search className="absolute left-3 size-4 text-[#A1A1AA] pointer-events-none z-10" />
            <Input
              placeholder={cityName ? `Buscar en ${cityName}...` : "Buscar un lugar específico..."}
              value={search}
              disabled={disabled}
              onChange={handleSearchChange}
              onFocus={() => search.trim().length >= 3 && setOpen(true)}
              className={cn(
                "pl-9 pr-10 h-12 w-full rounded-lg border-[#E4E4E7] bg-white text-[#09090B] placeholder:text-[#A1A1AA] shadow-none",
                "focus-visible:ring-1 focus-visible:ring-[#E63946]/20 focus-visible:border-[#E63946]",
                "transition-colors",
              )}
              aria-label="Buscar un lugar"
            />
            {loading && (
              <Loader2 className="absolute right-3 size-4 animate-spin text-[#A1A1AA]" />
            )}
          </div>
        </PopoverTrigger>

        <PopoverContent
          className="w-(--radix-popover-trigger-width) p-1 bg-white border border-[#E4E4E7] rounded-xl shadow-card z-200"
          align="start"
          sideOffset={4}
          style={{ width: containerRef.current?.offsetWidth }}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="max-h-80 overflow-y-auto">
            {/* Loading */}
            {loading && (
              <div className="flex items-center gap-2.5 px-4 py-3 text-sm text-[#71717A]">
                <Loader2 className="size-4 animate-spin shrink-0" />
                Buscando lugares...
              </div>
            )}

            {/* Resultados */}
            {!loading && options.length > 0 && options.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => handleSelectOption(option)}
                className="w-full flex items-start gap-3 px-4 py-3 text-left rounded-lg transition-colors hover:bg-[#FDF2F4] focus:bg-[#FDF2F4] outline-none group"
              >
                <MapPin className="size-4 text-[#A1A1AA] group-hover:text-[#E63946] shrink-0 mt-0.5 transition-colors" />
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="font-semibold text-sm text-[#09090B] leading-snug">
                    {option.name}
                  </span>
                  {option.subtext && (
                    <span className="text-xs text-[#71717A] leading-snug">
                      {option.subtext}
                    </span>
                  )}
                </div>
              </button>
            ))}

            {/* Sin resultados */}
            {!loading && hasSearched && !hasError && options.length === 0 && (
              <div className="px-4 py-4 text-center">
                <p className="text-sm font-medium text-[#09090B]">No encontramos lugares</p>
                <p className="text-xs text-[#71717A] mt-1">Prueba con otro nombre o dirección.</p>
              </div>
            )}

            {/* Error */}
            {!loading && hasError && (
              <div className="px-4 py-4 text-center">
                <p className="text-sm font-medium text-[#09090B]">No pudimos buscar lugares</p>
                <p className="text-xs text-[#71717A] mt-1">Intenta nuevamente.</p>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};