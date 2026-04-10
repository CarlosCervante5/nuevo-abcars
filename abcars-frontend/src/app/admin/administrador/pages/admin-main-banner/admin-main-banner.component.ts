import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MainBannerPageModule } from '../../../marketing/main-banner-page.module';

@Component({
  selector: 'app-admin-main-banner',
  templateUrl: './admin-main-banner.component.html',
  styleUrls: ['./admin-main-banner.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule, MainBannerPageModule]
})
export class AdminMainBannerComponent {}
