import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

// Form
import { UntypedFormGroup } from '@angular/forms';

// HTTP Client
import { HttpClient, HttpHeaders } from '@angular/common/http';

// Enviroment
import { environment } from '@environments/environment';

// Interfaces
import { RecoverAccount , ResetPassword, LoginResponse, LogoutResponse, RegisterResponse} from '../../shared/interfaces/auth.interface';

// Services
import { AuthStateService } from '../../shared/services/auth-state.service';


@Injectable({
    providedIn: 'root'
})

export class AuthService {

    // Global Url
    private url: string = environment.baseUrl;

    // Headers
    private headers = new HttpHeaders().set('Content-Type', 'application/json').set('X-Requested-With', 'XMLHttpRequest');

    constructor(
        private _http: HttpClient,
        private _authStateService: AuthStateService
    ) { }

    /**
     * API Login
     */
    public login(user: UntypedFormGroup): Observable<LoginResponse> {   
        return this._http.post<LoginResponse>(`${ this.url }/api/auth/login`, user.value, { headers: this.headers });
    }

    /**
     * API Logout
     */
    public logout(): Observable<LogoutResponse> {

        let user_token = this._authStateService.getToken();
        let headers = new HttpHeaders().set('Authorization', `Bearer ${user_token}`);

        return this._http.post<LogoutResponse>(`${ this.url }/api/auth/logout`, null , { headers });
    }

    /**
     * Set authentication state
     */
    public setAuthState(token: string, user: any, role: string): void {
        this._authStateService.setAuthState(token, user, role);
    }

    /**
     * Clear local authentication state
     */
    public clearAuthState(): void {
        this._authStateService.clearAuthState();
    }

    /**
     * API Register
     */
    public register(user: UntypedFormGroup): Observable<RegisterResponse> {
        return this._http.post<RegisterResponse>(`${ this.url }/api/auth/register`, user, { headers: this.headers });
    }

    /**
     * API recover account
     */
    public recoverAccount(email: string): Observable<RecoverAccount> {
        let body = {
        "email":email
        }
        return this._http.post<RecoverAccount>(`${ this.url }/api/auth/recover_account`, body);
    }

    public resetPassword( token_user :string, token_validate :string, password:string, confirmPassword:string ): Observable<ResetPassword>{
        
        let body = {
        "token_user":token_user,
        "token_validate": token_validate,
        "password":password,
        "password_confirmation":confirmPassword
        }

        return this._http.post<ResetPassword>(`${ this.url }/api/auth/reset_password`, body);
    }
}
