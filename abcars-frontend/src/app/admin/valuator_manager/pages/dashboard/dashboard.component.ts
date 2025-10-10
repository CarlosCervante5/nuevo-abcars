import { Component } from '@angular/core';
import { Overview } from '@interfaces/admin.interfaces';

@Component({
  selector: 'app-dashboard',
  // imports: [],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  standalone: false
})
export class DashboardComponent {

  private user = JSON.parse(localStorage.getItem('user')!);

  public itemOverview: Overview = {
    user: {
      name: this.user.name,
      surname: this.user.surname,
      role: 'valuation_manager',
      email: this.user.email,
      picturepath: ''
    },
    pages: [
      {
        title: 'Imprimir Valuaciones',
        icon: 'fi fi-rr-car',
        permalink: '/admin/valuation_manager/print-valuation'
      },
      {
        title: 'Precio Oferta de Clientes',
        icon: 'fi fi-rr-car',
        permalink: '/admin/valuation_manager/client-price-offer'
      }
    ]
  }

}
