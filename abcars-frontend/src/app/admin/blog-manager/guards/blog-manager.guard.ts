import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AccountService } from 'src/app/auth/pages/account/services/account.service';
import { validateRoleGuard } from '@helpers/guard.helper';

@Injectable({
  providedIn: 'root'
})
export class BlogManagerGuard  {

  constructor(
    private _router: Router, 
    private _accountService: AccountService
  ) {    
  }

  canActivate(): Observable<boolean> | Promise<boolean> | boolean {
    return validateRoleGuard('blog_manager', this._accountService, this._router);
  }

  canLoad(): Observable<boolean> | Promise<boolean> | boolean {
    return validateRoleGuard('blog_manager', this._accountService, this._router);
  }
}
