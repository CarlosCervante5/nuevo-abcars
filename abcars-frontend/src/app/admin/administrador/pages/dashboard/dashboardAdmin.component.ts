import { Component } from '@angular/core';
import { Overview } from '@interfaces/admin.interfaces';

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.css'],
    standalone: false
})
export class DashboardAdminComponent {

  private user = JSON.parse(localStorage.getItem('user')!);
  private role = localStorage.getItem('role') || 'administrator';
  public urlIndex = '/admin/administrator';
  public itemOverview: Overview = {
    user: {
      name: this.user.name,
      surname: this.user.surname,
      role: this.role === 'super_admin' ? 'Super Admin' : 'Admin',
      email: this.user.email,
      picturepath: ''
    },
    pages: [
      {
        title: 'Inventario',
        icon: 'fi fi-rr-car-garage',
        permalink: '/admin/marketing/vehicles',
        description: 'Gestiona el catálogo de vehículos, precios y estado.',
        iconColor: 'blue'
      },
      {
        title: 'Solicitudes',
        icon: 'fi fi-rr-clipboard-list',
        permalink: '/admin/appointment_manager/assing-valuations',
        description: 'Citas externas de valuación y solicitudes de clientes.',
        iconColor: 'purple'
      },
      {
        title: 'Valuaciones',
        icon: 'fi fi-rr-calendar-check',
        permalink: '/admin/valuator/appointment',
        description: 'Citas de valuación y seguimiento del proceso.',
        iconColor: 'green'
      },
      {
        title: 'Usuarios',
        icon: 'fi fi-rr-users-alt',
        permalink: '/admin/administrator/users',
        description: 'Crear, editar y administrar usuarios del sistema.',
        iconColor: 'amber'
      },
      {
        title: 'Roles y permisos',
        icon: 'fi fi-rr-settings-sliders',
        permalink: '/admin/administrator/permissions',
        description: 'Gestionar roles y permisos de acceso.',
        iconColor: 'blue'
      },
      {
        title: 'Sucursales',
        icon: 'fi fi-rr-store-alt',
        permalink: '/admin/administrator/dealerships',
        description: 'Crear, editar y gestionar sucursales y sus ubicaciones.',
        iconColor: 'blue'
      },
      {
        title: 'Información de la API',
        icon: 'fi fi-rr-code',
        permalink: '/admin/administrator/api-info',
        description: 'Base URL y endpoints de la API REST del backend.',
        iconColor: 'blue'
      },
      {
        title: 'Documentación',
        icon: 'fi fi-rr-document',
        permalink: '/admin/administrator/documentation',
        description: 'Documentación técnica, endpoints y guías de integración.',
        iconColor: 'purple'
      },
      {
        title: 'Analytics',
        icon: 'fi fi-rr-chart-histogram',
        permalink: '/admin/administrator/analytics',
        description: 'Visitas, formularios enviados, valuaciones y citas del sitio.',
        iconColor: 'green'
      },
      {
        title: 'Fotos de entregas',
        icon: 'fi fi-rr-gift',
        permalink: '/admin/gestor/delivery-photos',
        description: 'Carrusel de fotos de entregas de vehículos en el home.',
        iconColor: 'amber'
      }
    ]
  }

}
