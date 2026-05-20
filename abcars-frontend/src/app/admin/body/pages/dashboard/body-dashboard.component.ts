import { Component } from '@angular/core';
import { Overview } from '@interfaces/admin.interfaces';

@Component({
  selector: 'app-body-dashboard',
  templateUrl: './body-dashboard.component.html',
  styleUrls: ['./body-dashboard.component.css'],
  standalone: false,
})
export class BodyDashboardComponent {
  public itemOverview: Overview;

  constructor() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.itemOverview = {
      user: {
        name: user.name || user.nickname || 'Usuario',
        surname: user.surname || '',
        role: 'Body — HyP',
        email: user.email || '',
        picturepath: '',
      },
      pages: [
        {
          title: 'Órdenes HyP',
          icon: 'fi fi-rr-document',
          permalink: '/admin/body/ordenes',
        },
      ],
    };
  }
}
