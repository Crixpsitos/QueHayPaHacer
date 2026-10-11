"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { Camera, CameraOff, Info, Loader2, X } from "lucide-react";
import { checkInByCodeAction } from "@/app/actions/studio/check-in-by-code.action";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { EASE_OUT, SuccessCheck } from "@/app/components/motion/primitives";
import { cn } from "@/app/lib/utils/cn";

interface Props {
  eventId: string;
  sessionId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Outcome = { kind: "success" | "info" | "error"; text: string };
type CameraState = "starting" | "on" | "off";

const MAX_WIDTH = 640;
const FRAME_MS = 140; // ~7 fps
const DEBOUNCE_MS = 3000;
const NO_CAMERA = "No detectamos una cámara en este dispositivo. Abre esta pantalla en tu celular o escribe el código.";

const hasCameraApi = () => typeof navigator !== "undefined" && typeof navigator.mediaDevices?.getUserMedia === "function";

const cameraError = (e: unknown) => {
  const name = (e as { name?: string })?.name;
  if (name === "NotAllowedError" || name === "SecurityError")
    return "No hay permiso para usar la cámara. Actívalo en el navegador o escribe el código.";
  if (name === "NotReadableError") return "La cámara está en uso por otra aplicación. Ciérrala o escribe el código.";
  return NO_CAMERA;
};

export function AttendanceScannerDialog({ eventId, sessionId, open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">Escanear asistencia</DialogTitle>
          <DialogDescription>Apunta la cámara al QR del asistente o escribe su código.</DialogDescription>
        </DialogHeader>
        {/* Solo se monta abierto: al cerrar, el efecto libera la cámara. */}
        {open && <ScannerBody eventId={eventId} sessionId={sessionId} />}
      </DialogContent>
    </Dialog>
  );
}

function ScannerBody({ eventId, sessionId }: { eventId: string; sessionId?: string }) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const busy = useRef(false);
  const last = useRef({ text: "", at: 0 });

  const [camera, setCamera] = useState<CameraState>(() =>
    hasCameraApi() ? "starting" : "off",
  );
  const [cameraMsg, setCameraMsg] = useState(() =>
    hasCameraApi()
      ? ""
      : window.isSecureContext
        ? NO_CAMERA
        : "La cámara solo funciona en una conexión segura (https). Escribe el código.",
  );
  const still = useReducedMotion();
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [outcomeSeq, setOutcomeSeq] = useState(0); // reinicia la animación en cada resultado
  const [recent, setRecent] = useState<string[]>([]);
  const [manual, setManual] = useState("");
  const [sending, setSending] = useState(false);

  const submit = useCallback(
    async (text: string): Promise<boolean> => {
      if (busy.current) return false;
      busy.current = true;
      setSending(true);
      try {
        const res = await checkInByCodeAction({ eventId, sessionId, input: text }).catch(() => null);
        if (!res) setOutcome({ kind: "error", text: "No se pudo confirmar la asistencia." });
        else if (!res.success) setOutcome({ kind: "error", text: res.error ?? "No se pudo confirmar la asistencia." });
        else if (res.alreadyConfirmed) setOutcome({ kind: "info", text: `${res.name} ya estaba confirmado` });
        else {
          setOutcome({ kind: "success", text: `Asistencia confirmada: ${res.name}` });
          setRecent((r) => [res.name ?? "Asistente", ...r].slice(0, 5));
          router.refresh(); // actualiza la tabla y las estadísticas
        }
        return Boolean(res?.success);
      } finally {
        busy.current = false;
        setSending(false);
        setOutcomeSeq((n) => n + 1);
      }
    },
    [eventId, sessionId, router],
  );

  useEffect(() => {
    if (camera !== "starting") return;
    let stopped = false;
    let raf = 0;
    let stream: MediaStream | undefined;

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
        const { default: jsQR } = await import("jsqr"); // fuera del bundle principal
        const video = videoRef.current;
        if (stopped || !video) return stream.getTracks().forEach((t) => t.stop());
        video.srcObject = stream;
        await video.play();
        setCamera("on");

        const canvas = canvasRef.current!;
        const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
        let lastFrame = 0;
        const tick = (now: number) => {
          if (stopped) return;
          raf = requestAnimationFrame(tick);
          if (now - lastFrame < FRAME_MS || video.readyState < 2 || !video.videoWidth) return;
          lastFrame = now;
          const scale = Math.min(1, MAX_WIDTH / video.videoWidth);
          canvas.width = Math.round(video.videoWidth * scale);
          canvas.height = Math.round(video.videoHeight * scale);
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const found = jsQR(img.data, img.width, img.height, { inversionAttempts: "dontInvert" });
          if (!found?.data) return;
          const t = Date.now();
          if (found.data === last.current.text && t - last.current.at < DEBOUNCE_MS) return;
          last.current = { text: found.data, at: t };
          void submit(found.data);
        };
        raf = requestAnimationFrame(tick);
      } catch (e) {
        if (stopped) return;
        setCameraMsg(cameraError(e));
        setCamera("off");
      }
    })();

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [camera, submit]);

  const onManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manual.trim()) return;
    if (await submit(manual)) setManual("");
  };

  return (
    <div className="space-y-4">
      {camera !== "off" ? (
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-[#09090B]">
          <video ref={videoRef} muted playsInline className="size-full object-cover" aria-label="Vista de la cámara" />
          {camera === "starting" && (
            <p role="status" className="absolute inset-0 flex items-center justify-center gap-2 text-sm text-white/80">
              <Camera className="size-4" aria-hidden /> Iniciando cámara…
            </p>
          )}
          {camera === "on" && (
            <motion.span
              aria-hidden
              className="pointer-events-none absolute inset-8"
              initial={still ? false : { scale: 1.08, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, ease: EASE_OUT }}
            >
              {/* Esquinas de guía: se asientan una vez; con "reducir movimiento" quedan estáticas. */}
              <span className="absolute top-0 left-0 size-8 rounded-tl-xl border-t-[3px] border-l-[3px] border-white" />
              <span className="absolute top-0 right-0 size-8 rounded-tr-xl border-t-[3px] border-r-[3px] border-white" />
              <span className="absolute bottom-0 left-0 size-8 rounded-bl-xl border-b-[3px] border-l-[3px] border-white" />
              <span className="absolute right-0 bottom-0 size-8 rounded-br-xl border-r-[3px] border-b-[3px] border-white" />
            </motion.span>
          )}
        </div>
      ) : (
        <p className="flex items-start gap-2 rounded-2xl border border-[#E4E4E7] bg-[#FAFAFC] p-4 text-sm text-[#52525B]">
          <CameraOff className="mt-0.5 size-4 shrink-0" aria-hidden />
          {cameraMsg}
        </p>
      )}
      <canvas ref={canvasRef} hidden />

      <form onSubmit={onManual} className="space-y-2">
        <label htmlFor="checkin-manual" className="text-sm font-medium text-[#09090B]">
          Escribe el código
        </label>
        <div className="flex gap-2">
          <input
            id="checkin-manual"
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            placeholder="XXXX-XXXX-XXXX"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            className="h-12 min-w-0 flex-1 rounded-xl border border-[#E4E4E7] bg-white px-3 font-mono text-base tracking-wider uppercase outline-none focus-visible:ring-2 focus-visible:ring-[#E63946]"
          />
          <button
            type="submit"
            disabled={sending || !manual.trim()}
            className="inline-flex h-12 shrink-0 items-center gap-2 rounded-xl bg-[#09090B] px-5 text-sm font-semibold text-white hover:bg-[#27272A] disabled:opacity-50"
          >
            {sending && <Loader2 className="size-4 animate-spin" aria-hidden />}
            Confirmar
          </button>
        </div>
      </form>

      <div aria-live="polite" className="min-h-12">
        {outcome && (
          <motion.p
            key={outcomeSeq}
            initial={still ? false : outcome.kind === "error" ? { x: 0 } : { opacity: 0, y: 6 }}
            animate={
              outcome.kind === "error"
                ? { x: [0, -6, 6, -4, 0], opacity: 1, y: 0 }
                : { opacity: 1, y: 0 }
            }
            transition={{ duration: outcome.kind === "error" ? 0.3 : 0.25, ease: EASE_OUT }}
            className={cn(
              "flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-medium",
              outcome.kind === "success" && "bg-emerald-50 text-emerald-800",
              outcome.kind === "info" && "bg-zinc-100 text-zinc-700",
              outcome.kind === "error" && "bg-red-50 text-red-700",
            )}
          >
            {outcome.kind === "success" ? (
              <SuccessCheck size={28} className="shrink-0" />
            ) : outcome.kind === "info" ? (
              <Info className="size-4 shrink-0" aria-hidden />
            ) : (
              <X className="size-4 shrink-0" aria-hidden />
            )}
            {outcome.text}
          </motion.p>
        )}
      </div>

      {recent.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-[#71717A]">Últimas confirmaciones</h3>
          <ul className="mt-1 space-y-0.5 text-sm text-[#09090B]">
            {recent.map((n, i) => (
              <li key={`${n}-${i}`} className="truncate">{n}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
