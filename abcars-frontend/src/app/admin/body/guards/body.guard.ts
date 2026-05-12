import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AccountService } from 'src/app/auth/pages/account/services/account.service';
import { validateRoleGuard } from '@helpers/guard.helper';

@Injectable({
  providedIn: 'root',
})
export class BodyGuard {
  constructor(
    private readonly router: Router,
    private readonly accountService: AccountService,
  ) {}

  canActivate(): Observable<boolean> | Promise<boolean> | boolean {
    return validateRoleGuard(['body', 'administrator', 'super_admin'], this.accountService, this.router);
  }

  canLoad(): Observable<boolean> | Promise<boolean> | boolean {
    return validateRoleGuard(['body', 'administrator', 'super_admin'], this.accountService, this.router);
  }
}
