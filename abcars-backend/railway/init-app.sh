#!/bin/bash
set -e

# Cache config, routes and views for production
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Run migrations (safe if DB already has data from dump)
php artisan migrate --force

# Run seeders (idempotentes: firstOrCreate evita duplicados)
php artisan db:seed --class=RolesPermissionsSeeder --force
php artisan db:seed --class=DealershipsSeeder --force
php artisan db:seed --class=DeliveryPhotosSeeder --force

# Seeders exclusivos para entornos no productivos (sandbox/local).
# Requiere APP_ENV=sandbox en Railway Sandbox.
if [ "${APP_ENV}" = "sandbox" ] || [ "${APP_ENV}" = "local" ]; then
  php artisan db:seed --class=ValuatorsSeeder --force
  php artisan db:seed --class=TechnicianSeeder --force
  php artisan db:seed --class=PartsManagerSeeder --force
  php artisan db:seed --class=AppointmentManagerSeeder --force
  php artisan db:seed --class=ValuationCheckpointsSeeder --force
  php artisan db:seed --class=AcquisitionCheckpointsSeeder --force
  php artisan db:seed --class=IntellimotorsSeeder --force || true
  php artisan db:seed --class=ChevroletSellersSeeder --force || true
  php artisan db:seed --class=StregaSeeder --force || true
  php artisan db:seed --class=StregaSellersSeeder --force || true
  php artisan db:seed --class=StregaManagersSeeder --force || true
  php artisan db:seed --class=StregaFormsSeeder --force || true
  php artisan db:seed --class=StregaFollowUpSurveysSeeder --force || true
  php artisan db:seed --class=BodyworkTechnicianSeeder --force || true
  php artisan db:seed --class=BlogManagerSeeder --force || true
  php artisan db:seed --class=ReceptionistPermissionsSeeder --force || true
fi

# Create storage link for public files (ignores error if already exists)
php artisan storage:link 2>/dev/null || true
