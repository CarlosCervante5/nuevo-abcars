/** Etiqueta en español para `vehicles.fuel_type` (valores del ENUM en BD). */
const FUEL_TYPE_LABELS: Record<string, string> = {
  gasoline: 'Gasolina',
  diesel: 'Diésel',
  electric: 'Eléctrico',
  hybrid: 'Híbrido',
  hydrogen: 'Hidrógeno',
  natural_gas: 'Gas natural',
  gas: 'Gas LP',
};

export function formatFuelTypeLabel(fuelType: string | null | undefined): string {
  if (!fuelType || !String(fuelType).trim()) {
    return 'Gasolina';
  }
  const key = String(fuelType).trim().toLowerCase();
  return FUEL_TYPE_LABELS[key] ?? fuelType;
}
