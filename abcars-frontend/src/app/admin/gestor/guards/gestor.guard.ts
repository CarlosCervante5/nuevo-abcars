import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AccountService } from '../../../auth/pages/account/services/account.service';
import { validateRoleOrPermissionGuard } from '@helpers/guard.helper';

@Injectable({
  providedIn: 'root'
})
export class GestorGuard  {

  constructor(
    private _router: Router, 
    private _accountService: AccountService
  ) { }

  canActivate(): Observable<boolean> | boolean {
    return validateRoleOrPermissionGuard(
      ['gestor', 'administrator', 'super_admin'],
      ['manage delivery photos'],
      this._accountService,
      this._router
    );
  }

  canLoad(): Observable<boolean> | boolean {
    return validateRoleOrPermissionGuard(
      ['gestor', 'administrator', 'super_admin'],
      ['manage delivery photos'],
      this._accountService,
      this._router
    );
  }
}
