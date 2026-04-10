/** Roles y permisos Spatie para la sección de inventario / vehículos (alineado con MarketingGuard). */
export const VEHICLE_INVENTORY_GUARD_ROLES = [
  'marketing',
  'administrator',
  'super_admin'
] as const;

export const VEHICLE_INVENTORY_GUARD_PERMISSIONS = [
  'manage main banner',
  'list all vehicles',
  'create vehicles',
  'update vehicles',
  'delete vehicles'
] as const;
