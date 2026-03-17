#!/bin/bash
set -e

# Ensure a .env file exists where libraries might try to read it directly.
# The real configuration still comes from environment variables provided by Railway.
touch /app/.env 2>/dev/null || true
touch "$(pwd)/.env" 2>/dev/null || true

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

# Create storage link for public files (ignores error if already exists)
php artisan storage:link 2>/dev/null || true
