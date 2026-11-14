import Image from "next/image"
import Link from "@/app/components/ui/navigation/IntentLink"
import { fetchActiveCampaigns } from "@/app/components/feature/home/campaign/CampaignCarouselContainer"
import { ctaHref } from "@/application/cta/ctaHref"

/** Las campañas activas, en franja delgada (ya no ocupan el primer pantallazo). Con varias, se desliza de lado. No se dibuja sin campañas. */
export async function CampaignStrip() {
  const campaigns = await fetchActiveCampaigns()
  if (!campaigns.length) return null
  return (
    <ul className="relative -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 sm:mx-0 sm:px-0 [scrollbar-width:none]" aria-label="Novedades">
      {campaigns.map((c) => {
        const cta = c.cta?.find((x) => ctaHref(x))
        const href = cta ? ctaHref(cta) : undefined
        const external = !!href && /^https?:\/\//.test(href)
        const body = (
          <>
            <span className="relative block size-18 shrink-0 overflow-hidden rounded-2xl bg-brand-gold sm:size-26">
              <Image src={c.images.mobile.url} alt="" fill sizes="104px" className="object-cover" />
            </span>
            <span className="min-w-0 flex-1">
              {c.isSponsored ? <span className="mb-1 block text-[0.8125rem] font-semibold text-amber-ink">Promocionado</span> : null}
              <span className="block font-heading text-base font-bold leading-tight sm:text-2xl">{c.title}</span>
              {c.description ? <span className="mt-0.5 line-clamp-2 block text-[0.8125rem] text-amber-ink sm:text-[0.9375rem]">{c.description}</span> : null}
            </span>
            {cta ? <span className="hidden min-h-11 shrink-0 items-center rounded-full bg-primary-dark px-5 font-semibold text-white sm:flex">{cta.label}</span> : null}
          </>
        )
        const cls = "flex w-full items-center gap-3 rounded-3xl bg-accent p-3 text-wine sm:gap-4 sm:p-3.5 sm:pr-5"
        return (
          <li key={c.id} className="w-[calc(100%-2rem)] shrink-0 snap-start sm:w-full">
            {href ? (
              <Link href={href} data-campaign-id={c.id} className={`${cls} outline-none focus-visible:ring-3 focus-visible:ring-ring/50`} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{body}</Link>
            ) : (
              <div className={cls}>{body}</div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
