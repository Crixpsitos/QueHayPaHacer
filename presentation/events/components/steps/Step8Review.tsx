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
import { SummarySection } from "../ui/SummarySection";
import { SummaryItem } from "../ui/SummaryItem";
import { SessionsReviewSection } from "./SessionsReviewSection";
import { Badge } from "@/app/components/ui/badge";
import { renderToHTMLString } from "@tiptap/static-renderer";
import DOMPurify from "dompurify";
import StarterKit from "@tiptap/starter-kit";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  AvatarGroup,
  AvatarGroupCount,
} from "@/app/components/ui/avatar";

interface Step8ReviewProps {
  form: UseFormReturn<FormEventDto>;
  onGoToStep: (step: number) => void;
  /** En multi-fecha, fecha/lugar/registro/precio viven en cada sesión, no en el evento. */
  isMultiDate?: boolean;
}

const PROMOTION_PRICE_PER_DAY = 7500;

/** Feature flag: activar cuando Wompi esté configurado */
const PROMOTION_ENABLED = false;

const REGISTRATION_LABELS: Record<string, string> = {
  none: "Sin registro · entrada libre",
  internal: "Registro en QueHayPaHacer",
  external: "Sitio externo",
  form: "Formulario personalizado",
};

const ExpandableContent = ({ children }: { children: React.ReactNode }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldTruncate, setShouldTruncate] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    if (element.scrollHeight > 96) {
      requestAnimationFrame(() => setShouldTruncate(true));
    }
  }, [children]);

  return (
    <div className="w-full space-y-1.5">
      <div
        ref={containerRef}
        className={cn(
          "relative overflow-hidden transition-all duration-300 ease-in-out",
          isExpanded ? "max-h-250" : "max-h-24",
        )}
      >
        {children}
        {!isExpanded && shouldTruncate && (
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-10 bg-linear-to-t from-white via-white/80 to-transparent" />
        )}
      </div>
      {shouldTruncate && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 pt-0.5 text-xs font-semibold text-[#09090B] transition-opacity hover:opacity-70"
        >
          {isExpanded ? (
            <>Ver menos <ChevronUp className="size-3.5" /></>
          ) : (
            <>Ver más <ChevronDown className="size-3.5" /></>
          )}
        </button>
      )}
    </div>
  );
};

export const Step8Review = ({ form, onGoToStep, isMultiDate = false }: Step8ReviewProps) => {
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

  const collaboratorsData = form.watch("collaboratorsData") ?? {};
  const collabEntries = Object.entries(collaboratorsData);

  return (
    <div className="space-y-4">

      {/* Información básica */}
      <SummarySection title="Información básica" onEdit={() => onGoToStep(1)}>
        <SummaryItem label="Título" value={formData.title} />
        <SummaryItem
          label="Descripción corta"
          value={
            formData.shortDescription ? (
              <ExpandableContent>
                <p className="text-sm text-[#09090B]">{formData.shortDescription}</p>
              </ExpandableContent>
            ) : undefined
          }
        />
        <SummaryItem
          label="Descripción"
          value={
            formData.description ? (
              <ExpandableContent>
                <div
                  className="tiptap prose prose-sm max-w-none text-[#09090B] focus:outline-none"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(
                      renderToHTMLString({ content: formData.description, extensions }),
                      {
                        ALLOWED_TAGS: [
                          "p","br","strong","em","u","s","h1","h2","h3","h4","h5","h6",
                          "ul","ol","li","a","span","blockquote","code","pre","img",
                        ],
                        ALLOWED_ATTR: ["href","target","rel","src","alt","class","style"],
                      },
                    ),
                  }}
                />
              </ExpandableContent>
            ) : undefined
          }
        />
      </SummarySection>

      {/* Medios */}
      <SummarySection title="Medios" onEdit={() => onGoToStep(2)}>
        <SummaryItem
          label="Imagen principal"
          value={
            formData.mainImage?.url ? (
              <div className="flex items-center gap-3">
                <img
                  src={formData.mainImage.url}
                  alt="Imagen principal"
                  className="h-14 w-24 rounded-lg border border-[#F4F4F5] object-cover"
                />
                <span className="text-xs text-[#71717A]">Subida</span>
              </div>
            ) : undefined
          }
        />
        {(formData.media?.length ?? 0) > 0 && (
          <SummaryItem
            label="Galería"
            value={`${formData.media!.length} archivo${formData.media!.length !== 1 ? "s" : ""}`}
          />
        )}
      </SummarySection>

      {/* Clasificación */}
      <SummarySection title="Clasificación" onEdit={() => onGoToStep(3)}>
        <SummaryItem
          label="Categoría"
          value={formData.categoryInfo?.title}
        />
        {(formData.categoryInfo?.tags?.length ?? 0) > 0 && (
          <SummaryItem
            label="Etiquetas"
            value={
              <div className="flex flex-wrap gap-1.5">
                {formData.categoryInfo!.tags!.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-[#E4E4E7] bg-[#F4F4F5] px-2 py-0.5 text-[10px] font-medium text-[#71717A]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            }
          />
        )}
      </SummarySection>

      {/* Multi-fecha: fecha/lugar/registro/precio viven en cada sesión → preview por sesión */}
      {isMultiDate ? (
        <SessionsReviewSection eventId={formData.id} onEdit={() => onGoToStep(4)} />
      ) : (
        <>
          {/* Ubicación */}
          <SummarySection title="Ubicación" onEdit={() => onGoToStep(4)}>
            {formData.location?.city?.name && (
              <SummaryItem label="Ciudad" value={formData.location.city.name} />
            )}
            <SummaryItem label="Lugar" value={formData.location?.venue} />
            <SummaryItem label="Dirección" value={formData.location?.address} />
            {formData.location?.moreInfo && (
              <SummaryItem label="Más información" value={formData.location.moreInfo} />
            )}
            {formData.location?.coordinates?.lat && (
              <SummaryItem label="Mapa" value="Coordenadas configuradas" />
            )}
          </SummarySection>

          {/* Fecha */}
          <SummarySection title="Fecha" onEdit={() => onGoToStep(5)}>
            <SummaryItem
              label="Inicio"
              value={
                formData.startDate
                  ? format(new Date(formData.startDate), "PPP p", { locale: es })
                  : undefined
              }
            />
            <SummaryItem
              label="Finalización"
              value={
                formData.endDate
                  ? format(new Date(formData.endDate), "PPP p", { locale: es })
                  : undefined
              }
            />
          </SummarySection>

          {/* Registro */}
          <SummarySection title="Registro" onEdit={() => onGoToStep(6)}>
            <SummaryItem
              label="Tipo"
              value={REGISTRATION_LABELS[formData.registrationType ?? "none"]}
            />
            {formData.registrationType === "external" && (
              <SummaryItem
                label="Enlace externo"
                value={
                  formData.externalUrl ? (
                    <a
                      href={formData.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate text-sm text-[#E63946] hover:underline"
                    >
                      {formData.externalUrl}
                    </a>
                  ) : undefined
                }
              />
            )}
            {formData.registrationType === "form" && (
              <SummaryItem
                label="Preguntas"
                value={`${formData.registrationEventForm?.fields?.length ?? 0} pregunta${(formData.registrationEventForm?.fields?.length ?? 0) !== 1 ? "s" : ""}`}
              />
            )}
            {formData.capacity && formData.capacity > 0 ? (
              <SummaryItem label="Capacidad" value={`${formData.capacity} asistentes`} />
            ) : null}
          </SummarySection>

          {/* Precio */}
          <SummarySection title="Precio" onEdit={() => onGoToStep(7)}>
            <SummaryItem
              label="Entrada"
              value={
                formData.price?.isFree
                  ? "Gratis"
                  : formData.price?.amount && formData.price.amount > 0
                    ? `$${formData.price.amount.toLocaleString("es-CO")} COP por persona`
                    : undefined
              }
            />
          </SummarySection>
        </>
      )}

      {/* Colaboradores */}
      <SummarySection title="Colaboradores" onEdit={() => onGoToStep(8)}>
        {collabEntries.length > 0 ? (
          <div className="flex items-center gap-2.5">
            <AvatarGroup>
              {collabEntries.slice(0, 5).map(([refId, c]) => (
                <Avatar key={refId} className="size-7">
                  <AvatarImage src={c.photoURL ?? undefined} alt={c.displayName} />
                  <AvatarFallback className="text-[10px] font-semibold">
                    {c.displayName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ))}
              {collabEntries.length > 5 && (
                <AvatarGroupCount className="size-7 text-xs">
                  +{collabEntries.length - 5}
                </AvatarGroupCount>
              )}
            </AvatarGroup>
            <span className="text-sm text-[#71717A]">
              {collabEntries.length} colaborador{collabEntries.length > 1 ? "es" : ""}
            </span>
          </div>
        ) : (
          <p className="text-sm text-[#A1A1AA]">Sin colaboradores</p>
        )}
      </SummarySection>

      {/* Promoción — oculta hasta que PROMOTION_ENABLED = true */}
      {PROMOTION_ENABLED && (
        <>
          <div className="rounded border border-gray-200 p-4">
            <Controller
              control={form.control}
              name="promotion.isPromoted"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid.toString()} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <FieldLabel htmlFor="promote-event" className="text-sm font-medium text-gray-900">
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
                        /día). Ten en cuenta que el costo total se calculará según los días de
                        promoción seleccionados.
                      </FieldDescription>
                    </div>
                    <Switch
                      id="promote-event"
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        if (checked) {
                          const initialDate = startDate
                            ? new Date(startDate).toISOString()
                            : new Date().toISOString();
                          form.setValue("promotion.promotedAt", initialDate);
                          form.setValue("promotion.promotedUntil", initialDate);
                        } else {
                          setPromotionPaid(false);
                          form.setValue("promotion.promotedAt", null);
                          form.setValue("promotion.promotedUntil", null);
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
            <div className="mt-4 border-t border-gray-200 pt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Controller
                  control={form.control}
                  name="promotion.promotedAt"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid.toString()} className="space-y-1">
                      <FieldLabel className="text-sm font-semibold text-gray-700">
                        Día de promoción
                      </FieldLabel>
                      <Input
                        value={field.value ? format(new Date(field.value), "PPP", { locale: es }) : ""}
                        readOnly
                        className="bg-gray-50 capitalize text-gray-600"
                        aria-label="Promocionado el día del evento"
                      />
                    </Field>
                  )}
                />
                <Controller
                  control={form.control}
                  name="promotion.promotedUntil"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid.toString()} className="space-y-1">
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
                            selected={field.value ? new Date(field.value) : undefined}
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
                        <p className="text-sm font-medium text-gray-900">Costo total:</p>
                        <p className="text-xs text-gray-500">
                          {promotionDays} {promotionDays === 1 ? "día" : "días"} de promoción
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
                    La fecha de promoción seleccionada es posterior a la fecha de finalización del
                    evento. Asegúrate de ajustar las fechas para evitar problemas de visibilidad.
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
