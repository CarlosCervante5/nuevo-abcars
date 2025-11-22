import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface AuthUser {
  uuid: string;
  nickname: string;
  email: string;
  created_at: Date;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  role: string | null;
  token: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AuthStateService {
  private authStateSubject = new BehaviorSubject<AuthState>({
    isAuthenticated: false,
    user: null,
    role: null,
    token: null
  });

  public authState$ = this.authStateSubject.asObservable();

  constructor() {
    this.initializeAuthState();
  }

  private initializeAuthState(): void {
    const token = localStorage.getItem('user_token');
    const userStr = localStorage.getItem('user');
    const role = localStorage.getItem('role');

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        this.authStateSubject.next({
          isAuthenticated: true,
          user,
          role,
          token
        });
      } catch (error) {
        this.clearAuthState();
      }
    }
  }

  public setAuthState(token: string, user: AuthUser, role: string): void {
    localStorage.setItem('user_token', token);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('role', role);

    this.authStateSubject.next({
      isAuthenticated: true,
      user,
      role,
      token
    });
  }

  public clearAuthState(): void {
    localStorage.removeItem('user_token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    localStorage.removeItem('profile');

    this.authStateSubject.next({
      isAuthenticated: false,
      user: null,
      role: null,
      token: null
    });
  }

  public getCurrentAuthState(): AuthState {
    return this.authStateSubject.value;
  }

  public isAuthenticated(): boolean {
    return this.authStateSubject.value.isAuthenticated;
  }

  public getCurrentUser(): AuthUser | null {
    return this.authStateSubject.value.user;
  }

  public getCurrentRole(): string | null {
    return this.authStateSubject.value.role;
  }

  public getToken(): string | null {
    return this.authStateSubject.value.token;
  }
}














