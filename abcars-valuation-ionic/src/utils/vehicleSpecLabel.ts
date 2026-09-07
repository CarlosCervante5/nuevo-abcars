import { Vehicle } from '../models/Vehicle';

type VehicleEngineFields = Vehicle & {
  motorcycle_power_hp?: number | null;
  specification?: {
    intake_engine?: string | null;
    engine_type?: string | null;
  };
};

/** Etiqueta de motor para cards y ficha (cilindrada, HP en motos, cilindros). */
export function getEngineMotorLabel(vehicle: VehicleEngineFields | null | undefined): string {
  if (!vehicle) return 'N/D';

  const spec = vehicle.specification;
  if (spec?.intake_engine?.trim()) return spec.intake_engine.trim();
  if (spec?.engine_type?.trim()) return spec.engine_type.trim();

  if (vehicle.motorcycle_power_hp != null && Number(vehicle.motorcycle_power_hp) > 0) {
    return `${vehicle.motorcycle_power_hp} HP`;
  }

  if (vehicle.engine_displacement_cc != null && Number(vehicle.engine_displacement_cc) > 0) {
    return `${Number(vehicle.engine_displacement_cc).toLocaleString('es-MX')} cc`;
  }

  if (vehicle.cylinders != null && Number(vehicle.cylinders) > 0) {
    return `${vehicle.cylinders} cil`;
  }

  return 'N/D';
}
