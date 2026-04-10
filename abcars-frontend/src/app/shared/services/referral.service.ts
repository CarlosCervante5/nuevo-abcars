import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

const REFERRAL_SESSION_KEY = 'abcars_referrer_uuid';
/** localStorage: mismo origen en todas las pestañas (sessionStorage no se comparte entre pestañas). */
const REFERRAL_LOCAL_KEY = 'abcars_referrer_uuid';
const REFERRAL_LOCAL_TS_KEY = 'abcars_referrer_ts';
/** Ventana para atribuir la cita al vendedor tras abrir el link (30 días). */
const REFERRAL_TTL_MS = 30 * 24 * 60 * 60 * 1000;

@Injectable({ providedIn: 'root' })
export class ReferralService {

    /**
     * Captura el parámetro ?ref= del URL y lo guarda.
     * Llamar desde inventario, detalle de vehículo, valuación, etc.
     */
    captureFromUrl(route?: ActivatedRoute): void {
        const params = route?.snapshot?.queryParams ?? this.getQueryParamsFromWindow();
        const raw = params?.['ref'];
        const ref = Array.isArray(raw) ? raw[0] : raw;
        if (ref && typeof ref === 'string') {
            const trimmed = ref.trim();
            if (!trimmed) {
                return;
            }
            this.persistReferrer(trimmed);
        }
    }

    private getQueryParamsFromWindow(): Record<string, string> {
        try {
            const url = new URL(window.location.href);
            const params: Record<string, string> = {};
            url.searchParams.forEach((v, k) => {
                params[k] = v;
            });
            return params;
        } catch {
            return {};
        }
    }

    private persistReferrer(uuid: string): void {
        if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem(REFERRAL_SESSION_KEY, uuid);
        }
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(REFERRAL_LOCAL_KEY, uuid);
            localStorage.setItem(REFERRAL_LOCAL_TS_KEY, String(Date.now()));
        }
    }

    /**
     * UUID del vendedor guardado al abrir un link con ?ref=
     */
    getReferrerUuid(): string | null {
        if (typeof sessionStorage !== 'undefined') {
            const s = sessionStorage.getItem(REFERRAL_SESSION_KEY);
            if (s) {
                return s;
            }
        }
        if (typeof localStorage !== 'undefined') {
            const uuid = localStorage.getItem(REFERRAL_LOCAL_KEY);
            const tsRaw = localStorage.getItem(REFERRAL_LOCAL_TS_KEY);
            if (uuid && tsRaw) {
                const ts = Number(tsRaw);
                const age = Date.now() - ts;
                if (!Number.isNaN(age) && age >= 0 && age < REFERRAL_TTL_MS) {
                    return uuid;
                }
            }
            this.clearLocalReferrerOnly();
        }
        return null;
    }

    /**
     * Para [queryParams] en routerLink hacia valuación / inventario.
     */
    getReferralLinkQueryParams(): Record<string, string> {
        const ref = this.getReferrerUuid();
        return ref ? { ref } : {};
    }

    /**
     * Obtiene el referrer y lo borra (tras crear la cita, para no reutilizar).
     */
    consumeReferrerUuid(): string | null {
        const uuid = this.getReferrerUuid();
        if (typeof sessionStorage !== 'undefined') {
            sessionStorage.removeItem(REFERRAL_SESSION_KEY);
        }
        this.clearLocalReferrerOnly();
        return uuid;
    }

    private clearLocalReferrerOnly(): void {
        if (typeof localStorage !== 'undefined') {
            localStorage.removeItem(REFERRAL_LOCAL_KEY);
            localStorage.removeItem(REFERRAL_LOCAL_TS_KEY);
        }
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
