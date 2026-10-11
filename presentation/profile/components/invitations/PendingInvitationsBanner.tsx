"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MailPlus, X } from "lucide-react";
import { getPendingInvitationsCountAction } from "@/app/actions/studio/get-pending-invitations-count.action";

const KEY = "invitations-banner-dismissed";

export function PendingInvitationsBanner() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(KEY)) return;
    } catch {}
    void getPendingInvitationsCountAction().then(setCount);
  }, []);

  if (count === 0) return null;
  return (
    <div role="status" className="flex items-center gap-3 rounded-2xl border border-[#E4E4E7] bg-white px-4 py-3">
      <MailPlus className="size-5 shrink-0 text-[#E63946]" aria-hidden="true" />
      <p className="min-w-0 flex-1 text-sm text-zinc-700">
        Tienes {count === 1 ? "1 invitación" : `${count} invitaciones`} para colaborar.{" "}
        <Link href="/mis-invitaciones" className="font-medium text-[#E63946] underline-offset-4 hover:underline">
          Ver invitaciones
        </Link>
      </p>
      <button
        type="button"
        aria-label="Descartar aviso"
        className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100"
        onClick={() => {
          try {
            sessionStorage.setItem(KEY, "1");
          } catch {}
          setCount(0);
        }}
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
