export interface PriceTier {
    name: string;
    /** 0 = categoría gratis (el evento puede mezclar gratis y de pago). */
    amount: number;
    /** Qué incluye esta categoría (opcional). */
    description?: string;
}

export interface Price {
    isFree: boolean;
    /** Si hay `tiers`, es la categoría de pago más barata (filtros, tarjetas y SEO siguen leyendo este valor). */
    amount: number;
    currency: string;
    tiers?: PriceTier[];
}
