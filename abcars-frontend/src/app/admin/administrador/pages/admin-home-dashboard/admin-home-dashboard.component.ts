import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AdminPermissionService } from '@services/admin-permission.service';
import { AnalyticsComponent } from '../analytics/analytics.component';
import { VEHICLE_INVENTORY_GUARD_PERMISSIONS } from '../../config/vehicle-inventory.access';

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

  constructor(private adminPermission: AdminPermissionService) {}

  ngOnInit(): void {
    this.showMetrics =
      this.adminPermission.isFullAdminRole() ||
      this.adminPermission.hasAnyPermission(['view analytics dashboard']);
    this.showInventory =
      this.adminPermission.isFullAdminRole() ||
      this.adminPermission.hasAnyPermission([...VEHICLE_INVENTORY_GUARD_PERMISSIONS]);
  }
}
