export type MainBannerVariant = 'desktop' | 'mobile';

export interface MainBanner {
  status: number;
  message: string;
  data: MainBannerData;
}

export interface MainBannerData {
  /** Compatibilidad: desktop o, si no hay, móvil. */
  image_path?: string | null;
  image_path_desktop?: string | null;
  image_path_mobile?: string | null;
}
