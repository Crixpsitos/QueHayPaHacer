"use client";

import { useId } from "react";

type Variant = "owner" | "proposer" | "qhpa";

// ponytail: textos de sitio por variante; evento siempre usa "owner". Revisión legal pendiente (abogado).
const SITE_TEXT: Record<Exclude<Variant, "owner">, { label: string; full: string }> = {
  proposer: {
    label: "Declaro que soy responsable de lo que publico y entiendo que este sitio se mostrará como información comunitaria no verificada.",
    full: "Declaro que no soy necesariamente dueño ni representante de este sitio; que los datos que aporto son hechos verificables o públicos sobre el lugar; que las fotos, videos y textos que subo son míos, tengo derecho a usarlos o son de uso libre; que no uso logos o marcas de terceros ni datos personales de terceros sin autorización; y que soy responsable de lo que publico. Entiendo que el sitio aparecerá como información comunitaria, no verificada, y que su dueño puede pedir corregirlo o retirarlo.",
  },
  qhpa: {
    label: "Declaro que esta ficha se publica en nombre de Que Hay Pa Hacer? como información comunitaria no verificada.",
    full: "Esta ficha se publica en nombre de Que Hay Pa Hacer? como información comunitaria no verificada, sin vínculo con el establecimiento. Contiene datos fácticos propios y no incluye fotos ni logos de terceros sin licencia. Se retirará de inmediato a solicitud del titular del lugar.",
  },
};

/** Declaración del autor al publicar. El estado lo controla quien muestra el botón de publicar. */
export function AuthorDeclaration({
  kind,
  checked,
  onChange,
  invalid = false,
  variant = "owner",
}: {
  kind: "evento" | "sitio";
  checked: boolean;
  onChange: (checked: boolean) => void;
  invalid?: boolean;
  /** Solo aplica a sitios; los eventos usan siempre "owner". */
  variant?: Variant;
}) {
  const custom = kind === "sitio" && variant !== "owner" ? SITE_TEXT[variant] : null;
  const id = useId();
  return (
    <div
      className={`rounded-2xl border bg-white p-4 ${invalid ? "border-[#D42F3C]" : "border-[#E4E4E7]"}`}
    >
      <div className="flex items-start gap-3">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-invalid={invalid}
          aria-required
          className="mt-0.5 size-4 shrink-0 cursor-pointer accent-[#D42F3C]"
        />
        <div className="min-w-0 flex-1 text-xs leading-relaxed text-[#09090B]">
          <label htmlFor={id} className="cursor-pointer">
            {custom
              ? custom.label
              : `Declaro que tengo los derechos y permisos de este ${kind} y acepto la declaración de responsabilidad.`}
          </label>
          {/* Texto completo plegado: en celular ocupaba media pantalla. Sigue siendo la
              declaración que se acepta; solo se muestra bajo demanda. */}
          <details className="group mt-1.5">
            <summary className="cursor-pointer select-none py-1 font-medium text-[#D42F3C] marker:content-none hover:underline">
              <span className="group-open:hidden">Leer declaración completa</span>
              <span className="hidden group-open:inline">Ocultar declaración</span>
            </summary>
            <p className="mt-1 text-[#52525B]">
              {custom ? (
                custom.full
              ) : (
                <>
                  Declaro que tengo los derechos sobre los textos, imágenes y videos que publico, que
                  cuento con los permisos, licencias y autorizaciones que exija la ley para este{" "}
                  {kind} (incluidos derechos de comunicación pública, permisos de aglomeración y
                  seguros cuando apliquen) y que las personas que aparecen en el material autorizaron
                  su uso. Entiendo que soy el único responsable de este contenido y que Que Hay Pa
                  Hacer? actúa solo como intermediario.
                </>
              )}{" "}
              <a
                href="/terminos"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[#D42F3C] hover:underline"
              >
                Ver términos y condiciones
              </a>
            </p>
          </details>
        </div>
      </div>
      {invalid && (
        <p role="alert" className="mt-2 text-xs text-[#D42F3C]">
          Debes aceptar la declaración de responsabilidad para publicar.
        </p>
      )}
    </div>
  );
}
