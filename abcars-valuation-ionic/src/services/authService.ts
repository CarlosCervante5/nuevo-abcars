import { apiService } from './api';

export const authService = {
  logout(): void {
    // Limpiar token
    localStorage.removeItem('auth_token');
    // Limpiar usuario
    localStorage.removeItem('user');
    // Redirigir al login
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
  },

  getUser(): any | null {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },
};

