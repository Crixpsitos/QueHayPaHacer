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
        return;
      }

      setLoading(true);
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
        } catch (error) {
          console.error("Error fetching places:", error);
          setOptions([]);
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

  return (
    <div ref={containerRef} className="w-full relative">
      <Popover open={open && (options.length > 0 || loading)} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative flex items-center w-full">
            <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder={cityName ? `Buscar en ${cityName}...` : "Buscar un lugar específico..."}
              value={search}
              disabled={disabled}
              onChange={handleSearchChange}
              onFocus={() => search.trim().length >= 3 && setOpen(true)}
              className={cn(
                "pl-9 pr-10 w-full bg-background border-input font-normal text-foreground shadow-sm transition-all",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0",
                open && "rounded-b-none border-b-transparent"
              )}
              aria-label="Buscar un lugar"
            />
            {loading && (
              <Loader2 className="absolute right-3 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
        </PopoverTrigger>

        <PopoverContent 
          className="w-[var(--radix-popover-trigger-width)] p-1 bg-background border border-input rounded-b-md rounded-t-none shadow-md"
          align="start"
          style={{ width: containerRef.current?.offsetWidth }}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="max-h-[240px] overflow-y-auto flex flex-col gap-0.5">
            {options.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => handleSelectOption(option)}
                className={cn(
                  "w-full flex items-start gap-3 px-3 py-2.5 text-left rounded-md transition-colors",
                  "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground outline-none group"
                )}
              >
                <MapPin className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0 mt-0.5 transition-colors" />
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="font-medium text-sm text-foreground truncate">
                    {option.name}
                  </span>
                  {option.subtext && (
                    <span className="text-xs text-muted-foreground truncate">
                      {option.subtext}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};