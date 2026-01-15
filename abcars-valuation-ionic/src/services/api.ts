import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

// Configuración de API - cambiar según el entorno
// Para desarrollo local, usa: http://TU_IP_LOCAL:8000/api/
// Para producción: https://backend.abcars.mx/api/
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://backend.abcars.mx/api/';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    // Solo loguear una vez al inicializar
    if (!(window as any).__API_SERVICE_INITIALIZED__) {
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

    // Interceptor para agregar token
    this.api.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
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
        console.error('API Error:', JSON.stringify(errorInfo, null, 2));
        console.error('Full error:', error);
        
        if (error.response?.status === 401) {
          console.warn('Token inválido o expirado. Limpiando token...');
          this.clearToken();
          // Limpiar también el usuario
          localStorage.removeItem('user');
          // Redirigir al login después de un breve delay para permitir que el error se propague
          setTimeout(() => {
            if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
              console.log('Redirigiendo al login por token inválido');
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

