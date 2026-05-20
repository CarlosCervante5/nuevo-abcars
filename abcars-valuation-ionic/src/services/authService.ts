import api from './api';

function clearSessionAndRedirect(): void {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user');
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}

export const authService = {
  async logout(): Promise<void> {
    const token = localStorage.getItem('auth_token');
    if (token) {
      try {
        await api.post('auth/logout');
      } catch {
        /* invalidar sesión local aunque falle el servidor */
      }
    }
    clearSessionAndRedirect();
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

