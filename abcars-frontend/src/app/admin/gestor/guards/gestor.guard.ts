import { Injectable } from '@angular/core';
import { Route, UrlSegment, UrlTree, Router } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { AccountService } from '../../../auth/pages/account/services/account.service';

@Injectable({
  providedIn: 'root'
})
export class GestorGuard  {

  constructor(
    private _router: Router, 
    private _accountService: AccountService
  ) { }

  canActivate(): Observable<boolean> | boolean {
    console.log('GestorGuard: Checking permissions...');
    
    const user_token = localStorage.getItem('user_token');
    const role = localStorage.getItem('role');
    
    console.log('GestorGuard: user_token exists:', !!user_token);
    console.log('GestorGuard: role:', role);
    
    if (!user_token || role !== 'gestor') {
      console.log('GestorGuard: Access denied, redirecting to login');
      this._router.navigateByUrl('/auth/iniciar-sesion');
      return false;
    }
    
    console.log('GestorGuard: Access granted');
    return true;
  }

  canLoad(): Observable<boolean> | boolean {
    console.log('GestorGuard: Checking load permissions...');
    
    const user_token = localStorage.getItem('user_token');
    const role = localStorage.getItem('role');
    
    console.log('GestorGuard: user_token exists:', !!user_token);
    console.log('GestorGuard: role:', role);
    
    if (!user_token || role !== 'gestor') {
      console.log('GestorGuard: Load access denied, redirecting to login');
      this._router.navigateByUrl('/auth/iniciar-sesion');
      return false;
    }
    
    console.log('GestorGuard: Load access granted');
    return true;
  }
}
