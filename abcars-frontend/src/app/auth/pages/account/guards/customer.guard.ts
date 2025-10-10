import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AccountService } from '@services/account.service';
import { Observable, Subject } from 'rxjs';

// Services

@Injectable({
  providedIn: 'root'
})

export class CustomerGuard  {

  constructor(
    private _router: Router, 
    private _accountService: AccountService
  ) {}

  canActivate(): Observable<boolean> | Promise<boolean> | boolean {
    
    // Solo verificar si hay token y rol localmente
    const token = localStorage.getItem('user_token');
    const role = localStorage.getItem('role');
    
    if (!token || role !== 'client') {
      console.log('CustomerGuard: No token or invalid role, redirecting to login');
      this._router.navigateByUrl('/auth/iniciar-sesion');
      return false;
    }
    
    console.log('CustomerGuard: Token and role valid, allowing access');
    return true;
  }

  canLoad(): Observable<boolean> | Promise<boolean> | boolean {
    
    // Solo verificar si hay token y rol localmente
    const token = localStorage.getItem('user_token');
    const role = localStorage.getItem('role');
    
    if (!token || role !== 'client') {
      console.log('CustomerGuard canLoad: No token or invalid role, redirecting to login');
      this._router.navigateByUrl('/auth/iniciar-sesion');
      return false;
    }
    
    console.log('CustomerGuard canLoad: Token and role valid, allowing access');
    return true;
  }
}
