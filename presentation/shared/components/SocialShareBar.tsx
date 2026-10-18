"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { SPRING_SNAPPY } from "@/app/components/motion/primitives";
import { Link2, Check } from "lucide-react";
import { cn } from "@/app/lib/utils/cn";

interface SocialShareBarProps {
  /** URL completa de la página a compartir */
  url: string;
  /** Título del contenido */
  title: string;
  /** Callback que se ejecuta al compartir (para registrar el share en analytics) */
  onShare?: () => Promise<void> | void;
  className?: string;
}

// ── Iconos SVG inline (WhatsApp, X, Facebook) ────────────────────────────────

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

export function SocialShareBar({ url, title, onShare, className }: SocialShareBarProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const still = useReducedMotion();
  useEffect(() => () => clearTimeout(timer.current), []);

  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(title);

  const handleNetworkClick = () => {
    onShare?.();
  };

  const networks = [
    {
      label: "WhatsApp",
      href: `https://api.whatsapp.com/send?text=${encodeURIComponent(`${title} - ${url}`)}`,
      Icon: WhatsAppIcon,
      colorClass: "hover:border-green-300 hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-950/30 dark:hover:text-green-400",
    },
    {
      label: "X",
      href: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      Icon: XIcon,
      colorClass: "hover:border-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800",
    },
    {
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      Icon: FacebookIcon,
      colorClass: "hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-950/30 dark:hover:text-blue-400",
    },
  ] as const;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1500);
      onShare?.();
    } catch { /* noop */ }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-sm font-medium text-[#71717A]">
        Compartir en:
      </p>

      <div className="flex flex-wrap gap-1.5">
        {networks.map(({ label, href, Icon, colorClass }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleNetworkClick}
            aria-label={`Compartir en ${label}`}
            className={cn(
              "flex min-h-11 items-center gap-1.5 rounded-full border border-[#E4E4E7] bg-white px-3.5 py-1.5 text-xs font-medium text-[#52525B] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E63946] focus-visible:ring-offset-2",
              colorClass,
            )}
          >
            <Icon className="size-3.5 shrink-0" />
            {label}
          </a>
        ))}

        <button
          type="button"
          onClick={handleCopy}
          className="flex min-h-11 items-center gap-1.5 rounded-full border border-[#E4E4E7] bg-white px-3.5 py-1.5 text-xs font-medium text-[#52525B] transition-colors hover:border-[#09090B] hover:bg-[#FAFAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E63946] focus-visible:ring-offset-2"
        >
          {copied ? (
            <motion.span
              key="ok"
              className="flex items-center gap-1.5 text-emerald-700"
              initial={still ? false : { scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={SPRING_SNAPPY}
            >
              <Check className="size-3.5" aria-hidden="true" />
              Copiado
            </motion.span>
          ) : (
            <><Link2 className="size-3.5" aria-hidden="true" />Copiar enlace</>
          )}
        </button>
        <span role="status" aria-live="polite" className="sr-only">{copied ? "Enlace copiado" : ""}</span>
      </div>
    </div>
  );
}
