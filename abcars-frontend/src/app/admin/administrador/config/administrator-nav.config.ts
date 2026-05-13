import { OverviewPages } from '@interfaces/admin.interfaces';
import { VEHICLE_INVENTORY_GUARD_PERMISSIONS } from './vehicle-inventory.access';
import { MAIN_BANNER_GUARD_PERMISSIONS } from './main-banner.access';

/** Entrada de menú lateral del panel administrator (rutas bajo /admin/administrator/* o absolutas). */
export interface AdministratorNavItem extends OverviewPages {
  /** Rutas para RouterLink: rutas hijas del shell (p. ej. ['users', 'vehicles']) o absolutas a otros módulos admin. */
  routerLink: unknown[] | string;
}

export const ADMINISTRATOR_NAV_ITEMS: AdministratorNavItem[] = [
  {
    title: 'Inicio',
    icon: 'fi fi-rr-home',
    routerLink: ['/admin/administrator'],
    description: 'Resumen y métricas',
    iconColor: 'amber'
  },
  {
    title: 'Inventario',
    icon: 'fi fi-rr-car-garage',
    routerLink: ['vehicles'],
    description: 'Catálogo de vehículos',
    iconColor: 'blue',
    requiredPermissions: [...VEHICLE_INVENTORY_GUARD_PERMISSIONS]
  },
  {
    title: 'Intelimotor',
    icon: 'fi fi-rr-link-alt',
    routerLink: ['/admin/administrator/intelimotor'],
    description: 'Conexión e inventario externo',
    iconColor: 'green',
    requiredRoles: ['administrator', 'super_admin']
  },
  {
    title: 'Banner del inicio',
    icon: 'fi fi-rr-picture',
    routerLink: ['home-banner'],
    description: 'Imagen principal del hero',
    iconColor: 'amber',
    requiredPermissions: [...MAIN_BANNER_GUARD_PERMISSIONS]
  },
  {
    title: 'Solicitudes',
    icon: 'fi fi-rr-clipboard-list',
    routerLink: ['assing-valuations'],
    description: 'Citas y solicitudes',
    iconColor: 'purple',
    requiredRoles: ['appointment_manager', 'valuation_manager'],
    requiredPermissions: ['view analytics dashboard']
  },
  {
    title: 'Valuaciones',
    icon: 'fi fi-rr-calendar-check',
    routerLink: ['valuation-appointments'],
    description: 'Citas de valuación',
    iconColor: 'green',
    requiredRoles: ['valuator', 'valuation_manager']
  },
  {
    title: 'Usuarios',
    icon: 'fi fi-rr-users-alt',
    routerLink: ['users'],
    description: 'Usuarios del sistema',
    iconColor: 'amber',
    requiredPermissions: ['list users', 'create users', 'update users', 'delete users']
  },
  {
    title: 'Roles y permisos',
    icon: 'fi fi-rr-settings-sliders',
    routerLink: ['permissions'],
    description: 'Roles Spatie',
    iconColor: 'blue',
    requiredRoles: ['administrator', 'super_admin']
  },
  {
    title: 'Sucursales',
    icon: 'fi fi-rr-store-alt',
    routerLink: ['dealerships'],
    description: 'Sucursales y ubicaciones',
    iconColor: 'blue',
    requiredRoles: ['administrator', 'super_admin']
  },
  {
    title: 'Marcas y modelos',
    icon: 'fi fi-rr-layers',
    routerLink: ['brands-models'],
    description: 'Catálogo de marcas y modelos de inventario',
    iconColor: 'blue',
    requiredRoles: ['administrator', 'super_admin']
  },
  {
    title: 'Información de la API',
    icon: 'fi fi-rr-code',
    routerLink: ['api-info'],
    description: 'Endpoints REST',
    iconColor: 'blue',
    requiredRoles: ['administrator', 'super_admin']
  },
  {
    title: 'Documentación',
    icon: 'fi fi-rr-document',
    routerLink: ['documentation'],
    description: 'Guías técnicas',
    iconColor: 'purple',
    requiredRoles: ['administrator', 'super_admin']
  },
  {
    title: 'Analytics',
    icon: 'fi fi-rr-chart-histogram',
    routerLink: ['analytics'],
    description: 'Visitas, formularios y métricas de negocio',
    iconColor: 'green',
    requiredPermissions: ['view analytics dashboard']
  },
  {
    title: 'Asistente de datos',
    icon: 'fi fi-rr-comment-dots',
    routerLink: ['assistant'],
    description: 'Consultas en lenguaje natural',
    iconColor: 'purple',
    requiredRoles: ['administrator', 'super_admin']
  },
  {
    title: 'Fotos de entregas',
    icon: 'fi fi-rr-gift',
    routerLink: ['delivery-photos'],
    description: 'Carrusel del home',
    iconColor: 'amber',
    requiredPermissions: ['manage delivery photos'],
    requiredRoles: ['gestor', 'administrator', 'super_admin']
  },
  {
    title: 'Promociones',
    icon: 'fi fi-rr-badge-percent',
    routerLink: ['promotions'],
    description: 'Campañas e imágenes promocionales',
    iconColor: 'purple',
    requiredRoles: ['gestor', 'administrator', 'super_admin']
  }
];
