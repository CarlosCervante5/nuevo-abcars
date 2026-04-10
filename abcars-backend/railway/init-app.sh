#!/bin/bash
set -e

# Cache config, routes and views for production
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Run migrations (safe if DB already has data from dump)
php artisan migrate --force

# Seeders: no se ejecutan en deploy/Railway. Roles/permisos solo manual si hace falta:
#   php artisan db:seed --class=RolesPermissionsSeeder --force

# Create storage link for public files (ignores error if already exists)
php artisan storage:link 2>/dev/null || true

# Prueba SMTP opcional en deploy (Railway): RAILWAY_DEPLOY_MAIL_TEST=1 + MAIL_DEPLOY_TEST_TO
chmod +x ./railway/send-deploy-test-mail.sh 2>/dev/null || true
sh ./railway/send-deploy-test-mail.sh
