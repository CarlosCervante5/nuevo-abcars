#!/bin/bash
# Arranque según ABCARS_PROCESS_ROLE (variable por servicio en Railway).
# El railway.toml fija este script; la UI no permite otro Start Command.
#
# Roles:
#   web        → API HTTP (por defecto)
#   scheduler  → php artisan schedule:run (ideal con Cron Schedule */5 * * * *)
#   queue      → php artisan queue:work (correos/jobs con QUEUE_CONNECTION=database)
#
set -e

ROLE="${ABCARS_PROCESS_ROLE:-web}"

case "$ROLE" in
  scheduler)
    echo "[start] ABCARS_PROCESS_ROLE=scheduler → schedule:run"
    exec php artisan schedule:run --no-interaction
    ;;
  queue)
    echo "[start] ABCARS_PROCESS_ROLE=queue → queue:work"
    exec php artisan queue:work --sleep=3 --tries=3 --max-time=3600 --no-interaction
    ;;
  web|*)
    echo "[start] ABCARS_PROCESS_ROLE=${ROLE} → serve"
    exec php artisan serve --host=0.0.0.0 --port "${PORT:?PORT is required}"
    ;;
esac
