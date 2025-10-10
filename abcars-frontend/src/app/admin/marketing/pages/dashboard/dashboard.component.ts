import { Component } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
//import { Overview } from '../../../interfaces/overview.interface';
import { Overview } from '@interfaces/admin.interfaces';
import { MainBannerComponent } from '../../components/main-banner/main-banner.component';

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.css'],
    standalone: false
})
export class DashboardComponent {                                                                                                                                                                  
  constructor(
    private bottomSheet: MatBottomSheet
  ) {}
  // References Overview
  private user = JSON.parse(localStorage.getItem('user')!); 
  public itemOverview: Overview = {
    user: {
      name: this.user.name,
      surname: this.user.surname,
      role: 'Marketing',
      email: this.user.email,
      picturepath: ''
    },
    pages: [
      {
        title: 'Vehículos',
        icon: 'fi fi-rr-car',
        permalink: '/admin/marketing/vehicles'
      },
      {
        title: 'Banner principal',
        icon: 'fi fi-rr-car',
        // permalink: ''
        action: () => this.openBannerBottomSheet()
      },
    ]
  };

  openBannerBottomSheet() {
    this.bottomSheet.open(MainBannerComponent);
  }
}
