import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AccountService } from 'src/app/auth/pages/account/services/account.service';
import { validateRoleGuard } from '@helpers/guard.helper';

@Injectable({
  providedIn: 'root'
})
export class AppointmentManagerGuard  {

  constructor(
    private _router: Router, 
    private _accountService: AccountService
  ) {    
  }

  canActivate(): Observable<boolean> | Promise<boolean> | boolean {
    return validateRoleGuard(['appointment_manager', 'seller', 'administrator', 'super_admin'], this._accountService, this._router);
  }

  canLoad(): Observable<boolean> | Promise<boolean> | boolean {
    return validateRoleGuard(['appointment_manager', 'seller', 'administrator', 'super_admin'], this._accountService, this._router);
  }
}
