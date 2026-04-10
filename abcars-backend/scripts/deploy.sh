#!/bin/bash
set -e

echo "🔄 Ejecutando migraciones..."
# Incluye: add_coordinates_to_dealerships (lat, lng, address) y todas las pendientes
php artisan migrate --force

# Seeders: no se ejecutan en deploy (evita tocar roles/usuarios en producción).
# Manual si hace falta: php artisan db:seed --class=RolesPermissionsSeeder --force

echo "✅ Deploy completado correctamente."
