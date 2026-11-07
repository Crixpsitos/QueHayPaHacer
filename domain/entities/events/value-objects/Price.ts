export interface PriceTier {
    name: string;
    amount: number;
}

export interface Price {
    isFree: boolean;
    /** Si hay `tiers`, es la categoría más barata (filtros, tarjetas y SEO siguen leyendo este valor). */
    amount: number;
    currency: string;
    tiers?: PriceTier[];
}
