"use client";

import { Button } from "@/app/components/ui/button";
import { Calendar } from "@/app/components/ui/calendar";
import { Field, FieldDescription, FieldLabel } from "@/app/components/ui/field";
import { Input } from "@/app/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import { Switch } from "@/app/components/ui/switch";
import { cn } from "@/app/lib/utils/cn";
import { FormEventDto } from "@/application/dto/events/EventDto";
import { differenceInDays, format } from "date-fns";
import { AlertTriangle, CalendarIcon, DollarSign, ChevronDown, ChevronUp } from "lucide-react";
import { useState, useMemo, useRef, useEffect } from "react";
import { Controller, UseFormReturn } from "react-hook-form";
import { es } from "date-fns/locale";
import { Separator } from "@base-ui/react";
import { SummarySection } from "../ui/SummarySection";
import { SummaryItem } from "../ui/SummaryItem";
import { Badge } from "@/app/components/ui/badge";
import { renderToHTMLString } from "@tiptap/static-renderer";
import DOMPurify from "dompurify";
import StarterKit from "@tiptap/starter-kit";

interface Step8ReviewProps {
  form: UseFormReturn<FormEventDto>;
  onGoToStep: (step: number) => void;
}

const PROMOTION_PRICE_PER_DAY = 7500;

// Subcomponente de UI/UX para truncar de forma segura contenidos largos o HTML
const ExpandableContent = ({ children }: { children: React.ReactNode }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldTruncate, setShouldTruncate] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    // Si la altura total del contenido supera el límite visual (96px o ~4 líneas), activamos el truncado
    if (element.scrollHeight > 96) {
      // Evita setState sincrónico en efecto: usa requestAnimationFrame para evitar cascada de renders
      requestAnimationFrame(() => setShouldTruncate(true));
    }
  }, [children]);

  return (
    <div className="w-full space-y-1.5">
      <div
        ref={containerRef}
        className={cn(
          "transition-all duration-300 ease-in-out overflow-hidden relative",
          isExpanded ? "max-h-[1000px]" : "max-h-24"
        )}
      >
        {children}
        
        {/* Efecto difuminado elegante para dar la sensación de dropdown */}
        {!isExpanded && shouldTruncate && (
          <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />
        )}
      </div>

      {shouldTruncate && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-xs font-semibold text-gray-950 hover:opacity-80 transition-opacity pt-0.5"
        >
          {isExpanded ? (
            <>
              Ver menos <ChevronUp className="h-3.5 w-3.5" />
            </>
          ) : (
            <>
              Ver más <ChevronDown className="h-3.5 w-3.5" />
            </>
          )}
        </button>
      )}
    </div>
  );
};

export const Step8Review = ({ form, onGoToStep }: Step8ReviewProps) => {
  const formData = form.watch();
  const isPromoted = form.watch("promotion.isPromoted");
  const promotedUntil = form.watch("promotion.promotedUntil");
  const promotedAt = form.watch("promotion.promotedAt");
  const startDate = form.watch("startDate");
  const endDate = form.watch("endDate");
  const extensions = [StarterKit];

  const [promotionPaid, setPromotionPaid] = useState(false);

  const promotionDays = useMemo(() => {
    if (!isPromoted || !promotedUntil || !promotedAt) return 0;

    const start = new Date(promotedAt);
    start.setHours(0, 0, 0, 0);

    const end = new Date(promotedUntil);
    end.setHours(0, 0, 0, 0);

    return Math.max(1, differenceInDays(end, start) + 1);
  }, [isPromoted, promotedUntil, promotedAt]);

  const promotionCost = promotionDays * PROMOTION_PRICE_PER_DAY;

  const showPromotionWarning = useMemo(() => {
    if (!isPromoted || !promotedUntil || !endDate) return false;
    return promotedUntil > endDate;
  }, [isPromoted, promotedUntil, endDate]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-medium text-black">Promoción y Revisión</h2>
        <p className="text-gray-500 text-sm">
          Promociona tu evento para aumentar su visibilidad. Revisa toda la
          información antes de finalizar.
        </p>
      </div>

      <div className="rounded border border-gray-200 p-4">
        <Controller
          control={form.control}
          name="promotion.isPromoted"
          render={({ field, fieldState }) => (
            <Field
              data-invalid={fieldState.invalid.toString()}
              className="space-y-1"
            >
              <div className="flex items-center justify-between">
                <div>
                  <FieldLabel
                    htmlFor="promote-event"
                    className="text-sm font-medium text-gray-900"
                  >
                    ¿Promocionar tu evento?
                  </FieldLabel>
                  <FieldDescription className="text-sm text-gray-500">
                    Incrementa la visibilidad de tu evento (
                    {PROMOTION_PRICE_PER_DAY.toLocaleString("es-CO", {
                      style: "currency",
                      currency: "COP",
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                    /día). Ten en cuenta que el costo total se calculará según
                    los días de promoción seleccionados.
                  </FieldDescription>
                </div>
                <Switch
                  id="promote-event"
                  checked={field.value}
                  onCheckedChange={(checked) => {
                    field.onChange(checked);

                    if (checked) {
                      const initialDate = startDate ? new Date(startDate).toISOString() : new Date().toISOString();
                      form.setValue("promotion.promotedAt", initialDate);
                      form.setValue("promotion.promotedUntil", initialDate);
                    } else {
                      setPromotionPaid(false);
                      form.setValue("promotion.promotedAt", "");
                      form.setValue("promotion.promotedUntil", "");
                    }
                  }}
                  className="data-[state=checked]:bg-black"
                />
              </div>
            </Field>
          )}
        />
      </div>

      {isPromoted && (
        <div className="mt-4 border-t border-gray-200 pt-4 animate-in fade-in duration-200">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Día de promoción */}
            <Controller
              control={form.control}
              name="promotion.promotedAt"
              render={({ field, fieldState }) => (
                <Field
                  data-invalid={fieldState.invalid.toString()}
                  className="space-y-1"
                >
                  <FieldLabel className="text-sm font-semibold text-gray-700">
                    Día de promoción
                  </FieldLabel>
                  <Input
                    value={
                      field.value
                        ? format(new Date(field.value), "PPP", { locale: es })
                        : ""
                    }
                    readOnly
                    className="bg-gray-50 text-gray-600 capitalize"
                    aria-label="Promocionado el día del evento"
                  />
                </Field>
              )}
            />

            {/* Promocionado hasta */}
            <Controller
              control={form.control}
              name="promotion.promotedUntil"
              render={({ field, fieldState }) => (
                <Field
                  data-invalid={fieldState.invalid.toString()}
                  className="space-y-1"
                >
                  <FieldLabel className="text-sm font-semibold text-gray-700">
                    Promocionado hasta
                  </FieldLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start border-gray-300 text-left font-normal hover:bg-gray-50",
                          !field.value && "text-gray-500",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value
                          ? format(new Date(field.value), "PPP", { locale: es })
                          : "Seleccionar fecha"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        locale={es}
                        mode="single"
                        selected={
                          field.value ? new Date(field.value) : undefined
                        }
                        onSelect={(date) => {
                          if (!date) return;
                          field.onChange(date.toISOString());
                          setPromotionPaid(false);
                        }}
                        disabled={(date) => {
                          const startLimit = promotedAt ? new Date(promotedAt) : new Date();
                          startLimit.setHours(0, 0, 0, 0);

                          const eventEnd = endDate ? new Date(endDate) : null;
                          if (eventEnd) eventEnd.setHours(23, 59, 59, 999);

                          return date < startLimit || (eventEnd ? date > eventEnd : false);
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </Field>
              )}
            />
          </div>

          {promotedUntil && (
            <div className="mt-4 rounded-lg border border-gray-900 bg-gray-50 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-gray-700" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Costo total:
                    </p>
                    <p className="text-xs text-gray-500">
                      {promotionDays} {promotionDays === 1 ? "día" : "días"} de
                      promoción
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-semibold text-gray-900">
                    {promotionCost.toLocaleString("es-CO", {
                      style: "currency",
                      currency: "COP",
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                  </p>
                  <p className="text-xs text-gray-500">
                    {PROMOTION_PRICE_PER_DAY.toLocaleString("es-CO", {
                      style: "currency",
                      currency: "COP",
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                    /día
                  </p>
                </div>
              </div>
              {promotionPaid && (
                <div className="mt-3 flex items-center gap-2 rounded bg-green-50 p-2 text-sm text-green-700">
                  <span className="font-medium">Pago confirmado</span>
                </div>
              )}
            </div>
          )}
          {showPromotionWarning && (
            <div className="mt-4 flex items-center gap-2 rounded border border-gray-300 bg-gray-50 p-3">
              <AlertTriangle className="h-4 w-4 text-gray-700" />
              <p className="text-sm text-gray-700">
                La fecha de promoción seleccionada es posterior a la fecha de
                finalización del evento. Asegúrate de ajustar las fechas para
                evitar problemas de visibilidad.
              </p>
            </div>
          )}
        </div>
      )}
      <Separator />
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-black">Resumen del evento</h3>

        {/* Información Básica */}
        <SummarySection title="Información básica" onEdit={() => onGoToStep(1)}>
          <SummaryItem label="Título" value={formData.title} />
          
          <SummaryItem
            label="Descripción corta"
            value={
              formData.shortDescription ? (
                <ExpandableContent>
                  <p className="text-sm text-gray-800 break-words">{formData.shortDescription}</p>
                </ExpandableContent>
              ) : (
                "No proporcionado"
              )
            }
          />
          
          <SummaryItem
            label="Descripción"
            value={
              formData.description ? (
                <ExpandableContent>
                  <div
                    className="tiptap prose prose-sm max-w-none break-words text-gray-800 focus:outline-none"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(
                        renderToHTMLString({
                          content: formData.description,
                          extensions,
                        }),
                        {
                          ALLOWED_TAGS: [
                            "p", "br", "strong", "em", "u", "s", "h1", "h2", "h3", "h4", "h5", "h6",
                            "ul", "ol", "li", "a", "span", "blockquote", "code", "pre", "img",
                          ],
                          ALLOWED_ATTR: ["href", "target", "rel", "src", "alt", "class", "style"],
                        },
                      )
                    }}
                  />
                </ExpandableContent>
              ) : (
                "No proporcionado"
              )
            }
          />
        </SummarySection>

        {/* Medios */}
        <SummarySection title="Medios" onEdit={() => onGoToStep(2)}>
          <SummaryItem
            label="Imagen principal"
            value={formData.mainImage ? "Subida" : "No subida"}
          />
          <SummaryItem
            label="Medios adicionales"
            value={`${formData.media?.length || 0} archivos`}
          />
        </SummarySection>

        {/* Clasificación */}
        <SummarySection title="Clasificación" onEdit={() => onGoToStep(3)}>
          <SummaryItem
            label="Categoría"
            value={formData.categoryInfo?.title || "No seleccionado"}
          />
          <SummaryItem
            label="Etiquetas"
            value={
              formData.categoryInfo?.tags?.length ? (
                <div className="flex flex-wrap gap-1">
                  {formData.categoryInfo.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="border border-gray-300 bg-gray-100 text-xs"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              ) : (
                "No se proporcionaron etiquetas"
              )
            }
          />
        </SummarySection>

        {/* Ubicación */}
        <SummarySection title="Ubicación" onEdit={() => onGoToStep(4)}>
          <SummaryItem
            label="Lugar"
            value={formData.location?.venue || "No proporcionado"}
          />
          <SummaryItem
            label="Dirección"
            value={formData.location?.address || "No proporcionado"}
          />
          <SummaryItem
            label="Más información"
            value={formData.location?.moreInfo || "No proporcionado"}
          />
          <SummaryItem
            label="Coordenadas"
            value={
              formData.location?.coordinates?.lat
                ? `${formData.location.coordinates.lat}, ${formData.location.coordinates.lng}`
                : "No proporcionado"
            }
          />
        </SummarySection>

        {/* Fechas */}
        <SummarySection title="Fecha" onEdit={() => onGoToStep(5)}>
          <SummaryItem
            label="Inicio"
            value={
              formData.startDate
                ? format(new Date(formData.startDate), "PPP p", { locale: es })
                : "No proporcionado"
            }
          />
          <SummaryItem
            label="Finalización"
            value={
              formData.endDate
                ? format(new Date(formData.endDate), "PPP p", { locale: es })
                : "No proporcionado"
            }
          />
        </SummarySection>

        {/* Registro */}
        <SummarySection title="Registro" onEdit={() => onGoToStep(6)}>
          <SummaryItem
            label="Tipo"
            value={formData.registrationType?.replace("_", " ") || "Ninguno"}
          />
          {formData.registrationType === "external" && (
            <SummaryItem
              label="URL externa"
              value={formData.externalUrl || "No proporcionado"}
            />
          )}
          <SummaryItem
            label="Capacidad"
            value={
              formData.capacity
                ? `${formData.capacity} asistentes`
                : "Ilimitado"
            }
          />
        </SummarySection>

        {/* Precio */}
        <SummarySection title="Precio" onEdit={() => onGoToStep(7)}>
          <SummaryItem
            label="Precio"
            value={
              formData.price?.isFree
                ? "Gratis"
                : `${formData.price?.amount?.toLocaleString("es-CO")} ${
                    formData.price?.currency || "COP"
                  }`
            }
          />
        </SummarySection>
      </div>
    </div>
  );
};