import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AccountService } from 'src/app/auth/pages/account/services/account.service';
import { validateRoleGuard } from '@helpers/guard.helper';

@Injectable({
  providedIn: 'root'
})
export class ValuatorGuard  {

  constructor(
    private _router: Router, 
    private _accountService: AccountService
  ) {    
  }

  private readonly allowedRoles = ['valuator', 'seller', 'administrator', 'super_admin', 'appraiser_technician'];

  canActivate(): Observable<boolean> | Promise<boolean> | boolean {
    return validateRoleGuard(this.allowedRoles, this._accountService, this._router);
  }
}
