import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

const REFERRAL_STORAGE_KEY = 'abcars_referrer_uuid';

@Injectable({ providedIn: 'root' })
export class ReferralService {

    /**
     * Captura el parámetro ?ref= del URL y lo guarda en sessionStorage.
     * Llamar desde componentes que pueden ser entrada de links de referidos (inventario, vehiculo).
     */
    captureFromUrl(route?: ActivatedRoute): void {
        const params = route?.snapshot?.queryParams ?? this.getQueryParamsFromWindow();
        const ref = params?.['ref'];
        if (ref && typeof ref === 'string') {
            sessionStorage.setItem(REFERRAL_STORAGE_KEY, ref.trim());
        }
    }

    private getQueryParamsFromWindow(): Record<string, string> {
        try {
            const url = new URL(window.location.href);
            const params: Record<string, string> = {};
            url.searchParams.forEach((v, k) => { params[k] = v; });
            return params;
        } catch {
            return {};
        }
    }

    /**
     * Obtiene el UUID del referrer guardado (si existe).
     */
    getReferrerUuid(): string | null {
        return sessionStorage.getItem(REFERRAL_STORAGE_KEY);
    }

    /**
     * Obtiene y elimina el referrer (usar después de enviar la solicitud para no reutilizar).
     */
    consumeReferrerUuid(): string | null {
        const uuid = sessionStorage.getItem(REFERRAL_STORAGE_KEY);
        if (uuid) {
            sessionStorage.removeItem(REFERRAL_STORAGE_KEY);
        }
        return uuid;
    }

    /**
     * Construye la URL de referido general (inventario).
     */
    buildInventoryReferralUrl(referrerUuid: string): string {
        const base = typeof window !== 'undefined' ? window.location.origin : '';
        return `${base}/inventario?ref=${encodeURIComponent(referrerUuid)}`;
    }

    /**
     * Construye la URL de referido por unidad.
     */
    buildVehicleReferralUrl(vehicleUuid: string, referrerUuid: string): string {
        const base = typeof window !== 'undefined' ? window.location.origin : '';
        return `${base}/vehiculo/${vehicleUuid}?ref=${encodeURIComponent(referrerUuid)}`;
    }
}
