"use client";

import { useId } from "react";

/** Declaración del autor al publicar. El estado lo controla quien muestra el botón de publicar. */
export function AuthorDeclaration({
  kind,
  checked,
  onChange,
  invalid = false,
}: {
  kind: "evento" | "sitio";
  checked: boolean;
  onChange: (checked: boolean) => void;
  invalid?: boolean;
}) {
  const id = useId();
  return (
    <div
      className={`rounded-2xl border bg-white p-4 ${invalid ? "border-[#E63946]" : "border-[#E4E4E7]"}`}
    >
      <div className="flex items-start gap-3">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-invalid={invalid}
          aria-required
          className="mt-0.5 size-4 shrink-0 cursor-pointer accent-[#E63946]"
        />
        <label htmlFor={id} className="cursor-pointer text-xs leading-relaxed text-[#09090B]">
          Declaro que tengo los derechos sobre los textos, imágenes y videos que publico, que
          cuento con los permisos, licencias y autorizaciones que exija la ley para este {kind}{" "}
          (incluidos derechos de comunicación pública, permisos de aglomeración y seguros cuando
          apliquen) y que las personas que aparecen en el material autorizaron su uso. Entiendo que
          soy el único responsable de este contenido y que Que Hay Pa Hacer? actúa solo como
          intermediario.{" "}
          <a
            href="/terminos"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-[#E63946] hover:underline"
          >
            Ver términos y condiciones
          </a>
        </label>
      </div>
      {invalid && (
        <p role="alert" className="mt-2 text-xs text-[#E63946]">
          Debes aceptar la declaración de responsabilidad para publicar.
        </p>
      )}
    </div>
  );
}
