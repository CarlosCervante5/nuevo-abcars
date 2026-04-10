import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AccountService } from 'src/app/auth/pages/account/services/account.service';
import { validateRoleOrPermissionGuard } from '@helpers/guard.helper';

@Injectable({
  providedIn: 'root'
})
export class MarketingGuard  {

  constructor(
    private _router: Router, 
    private _accountService: AccountService
  ) {    
  }

  canActivate(): Observable<boolean> | Promise<boolean> | boolean {
    return validateRoleOrPermissionGuard(
      ['marketing', 'administrator', 'super_admin'],
      ['manage main banner', 'list all vehicles', 'create vehicles', 'update vehicles', 'delete vehicles'],
      this._accountService,
      this._router
    );
  }

  canLoad(): Observable<boolean> | Promise<boolean> | boolean {
    return validateRoleOrPermissionGuard(
      ['marketing', 'administrator', 'super_admin'],
      ['manage main banner', 'list all vehicles', 'create vehicles', 'update vehicles', 'delete vehicles'],
      this._accountService,
      this._router
    );
  }
}
