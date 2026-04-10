import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AccountService } from 'src/app/auth/pages/account/services/account.service';
import { validateRoleOrPermissionGuard } from '@helpers/guard.helper';
import {
  MAIN_BANNER_GUARD_PERMISSIONS,
  MAIN_BANNER_GUARD_ROLES
} from '../config/main-banner.access';

@Injectable({
  providedIn: 'root'
})
export class MainBannerGuard {
  constructor(
    private _router: Router,
    private _accountService: AccountService
  ) {}

  canActivate(): Observable<boolean> | Promise<boolean> | boolean {
    return validateRoleOrPermissionGuard(
      [...MAIN_BANNER_GUARD_ROLES],
      [...MAIN_BANNER_GUARD_PERMISSIONS],
      this._accountService,
      this._router
    );
  }
}
