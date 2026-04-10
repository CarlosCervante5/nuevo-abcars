import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AccountService } from 'src/app/auth/pages/account/services/account.service';
import { validateRoleOrPermissionGuard } from '@helpers/guard.helper';
import {
  VEHICLE_INVENTORY_GUARD_PERMISSIONS,
  VEHICLE_INVENTORY_GUARD_ROLES
} from '../config/vehicle-inventory.access';

@Injectable({
  providedIn: 'root'
})
export class VehicleInventoryGuard {
  constructor(
    private _router: Router,
    private _accountService: AccountService
  ) {}

  canActivate(): Observable<boolean> | Promise<boolean> | boolean {
    return validateRoleOrPermissionGuard(
      [...VEHICLE_INVENTORY_GUARD_ROLES],
      [...VEHICLE_INVENTORY_GUARD_PERMISSIONS],
      this._accountService,
      this._router
    );
  }
}
