#!/bin/bash
set -e

echo "🔄 Ejecutando migraciones..."
# Incluye: add_coordinates_to_dealerships (lat, lng, address) y todas las pendientes
php artisan migrate --force

echo "🌱 Ejecutando seeder de roles, permisos y admin..."
php artisan db:seed --class=RolesPermissionsSeeder --force

echo "✅ Deploy completado correctamente."
