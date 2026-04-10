import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AccountService } from 'src/app/auth/pages/account/services/account.service';
import { validateRoleGuard } from '@helpers/guard.helper';

/** Misma audiencia que el módulo gestor para campañas/promociones (API con auth:sanctum). */
@Injectable({
  providedIn: 'root'
})
export class GestorPromotionsGuard {
  constructor(
    private _router: Router,
    private _accountService: AccountService
  ) {}

  canActivate(): Observable<boolean> | Promise<boolean> | boolean {
    return validateRoleGuard(['gestor', 'administrator', 'super_admin'], this._accountService, this._router);
  }
}
