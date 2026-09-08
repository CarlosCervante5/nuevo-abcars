import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AdminPermissionService } from '@services/admin-permission.service';
import { AnalyticsComponent } from '../analytics/analytics.component';
import { VEHICLE_INVENTORY_GUARD_PERMISSIONS } from '../../config/vehicle-inventory.access';

const CARWASH_ROLES = [
  'carwash_admin',
  'carwash_supervisor',
  'carwash_cashier',
  'carwash_washer',
  'carwash_agent'
];

@Component({
  selector: 'app-admin-home-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, AnalyticsComponent],
  templateUrl: './admin-home-dashboard.component.html',
  styleUrls: ['./admin-home-dashboard.component.css']
})
export class AdminHomeDashboardComponent implements OnInit {
  showMetrics = false;
  showInventory = false;
  showIntelimotor = false;
  redirectingCarWash = false;

  constructor(
    private adminPermission: AdminPermissionService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const role = localStorage.getItem('role') || '';
    if (CARWASH_ROLES.includes(role)) {
      this.redirectingCarWash = true;
      void this.router.navigate(['/admin/administrator/carwash/board'], { replaceUrl: true });
      return;
    }

    this.showIntelimotor = this.adminPermission.isFullAdminRole();
    this.showMetrics =
      this.adminPermission.isFullAdminRole() ||
      this.adminPermission.hasAnyPermission(['view analytics dashboard']);
    this.showInventory =
      this.adminPermission.isFullAdminRole() ||
      this.adminPermission.hasAnyPermission([...VEHICLE_INVENTORY_GUARD_PERMISSIONS]);
  }
}
