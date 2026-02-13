/**
 * Detecta si hay conexión y notifica cuando vuelve (para sincronizar la cola offline).
 */
const ONLINE_EVENT = 'online';
const OFFLINE_EVENT = 'offline';

export const connectivityService = {
  isOnline(): boolean {
    return typeof navigator !== 'undefined' && navigator.onLine === true;
  },

  onOnline(callback: () => void): () => void {
    if (typeof window === 'undefined') return () => {};
    window.addEventListener(ONLINE_EVENT, callback);
    return () => window.removeEventListener(ONLINE_EVENT, callback);
  },

  onOffline(callback: () => void): () => void {
    if (typeof window === 'undefined') return () => {};
    window.addEventListener(OFFLINE_EVENT, callback);
    return () => window.removeEventListener(OFFLINE_EVENT, callback);
  },
};
