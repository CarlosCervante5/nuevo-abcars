import { Capacitor } from '@capacitor/core';
import axios, { AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { getApiBaseUrl } from '../config/apiBaseUrl';
import { attachNativeHttpAdapter } from './capacitorAxiosAdapter';

const API_BASE_URL = getApiBaseUrl();

/** Sin esto, el default `Content-Type: application/json` rompe multipart y Laravel no ve `images.*`. */
function isFormDataPayload(data: unknown): boolean {
  if (typeof FormData === 'undefined' || data == null) return false;
  if (data instanceof FormData) return true;
  const name = (data as { constructor?: { name?: string } }).constructor?.name;
  return name === 'FormData';
}

function stripContentTypeForMultipart(config: InternalAxiosRequestConfig): void {
  if (!isFormDataPayload(config.data)) return;
  const h = config.headers;
  if (!h) return;
  if (typeof (h as { delete?: (key: string) => void }).delete === 'function') {
    (h as { delete: (key: string) => void }).delete('Content-Type');
    (h as { delete: (key: string) => void }).delete('content-type');
    return;
  }
  const plain = h as Record<string, unknown>;
  delete plain['Content-Type'];
  delete plain['content-type'];
}

class ApiService {
  private api: AxiosInstance;

  constructor() {
    if (import.meta.env.DEV && !(window as any).__API_SERVICE_INITIALIZED__) {
      console.log('API Service initialized with baseURL:', API_BASE_URL);
      (window as any).__API_SERVICE_INITIALIZED__ = true;
    }
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    attachNativeHttpAdapter(this.api);
    if (Capacitor.isNativePlatform()) {
      this.api.defaults.timeout = 90000;
    }

    // Interceptor para agregar token (no enviar Bearer en login/registro: token viejo puede interferir)
    this.api.interceptors.request.use(
      (config) => {
        stripContentTypeForMultipart(config);

        const rel = (config.url || '').replace(/^\//, '');
        const skipBearer =
          rel.startsWith('auth/login') ||
          rel.startsWith('auth/register') ||
          rel.startsWith('auth/recover_account') ||
          rel.startsWith('auth/reset_password') ||
          rel.startsWith('auth/iternally_register');

        if (!skipBearer) {
          const token = this.getToken();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Interceptor para manejar errores
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        const errorInfo = {
          message: error.message,
          code: error.code,
          response: error.response?.data,
          status: error.response?.status,
          url: error.config?.url,
          baseURL: error.config?.baseURL,
          fullUrl: error.config ? `${error.config.baseURL}${error.config.url}` : 'N/A'
        };
        const isUpload =
          typeof error.config?.url === 'string' &&
          error.config.url.includes('vehicle_images');
        if (import.meta.env.DEV || isUpload) {
          console.error(
            isUpload ? '[ABCarsUpload] API Error:' : 'API Error:',
            JSON.stringify(errorInfo, null, 2),
          );
        }

        if (error.response?.status === 401) {
          if (import.meta.env.DEV) {
            console.warn('Token inválido o expirado. Limpiando token...');
          }
          this.clearToken();
          // Limpiar también el usuario
          localStorage.removeItem('user');
          // Redirigir al login después de un breve delay para permitir que el error se propague
          setTimeout(() => {
            if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
              window.location.href = '/login';
            }
          }, 100);
        }
        return Promise.reject(error);
      }
    );
  }

  private getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  private clearToken(): void {
    localStorage.removeItem('auth_token');
  }

  public setToken(token: string): void {
    localStorage.setItem('auth_token', token);
  }

  public getInstance(): AxiosInstance {
    return this.api;
  }
}

// Singleton pattern para evitar múltiples inicializaciones
let apiServiceInstance: ApiService | null = null;

export const apiService = (() => {
  if (!apiServiceInstance) {
    apiServiceInstance = new ApiService();
  }
  return apiServiceInstance;
})();

export default apiService.getInstance();

