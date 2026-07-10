/** Imagen servida desde el propio sitio (evita CDNs externos bloqueados o ERR_CONNECTION_RESET). */
export const FALLBACK_HERO_IMAGE = 'assets/images/hero-background.jpg';

/** Fallback de banners promocionales en el listado de inventario (puede cambiarse sin afectar showroom). */
export const INVENTORY_PROMO_FALLBACK_IMAGE = 'assets/images/hero-background.jpg';

export type CampaignPlacement = 'showroom' | 'inventory';
