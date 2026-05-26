# Backend Laravel en Railway

## `railway.toml` (bloquea la UI)

Railway **siempre** usa lo definido en código; el Custom Start Command del panel queda en solo lectura.

| Clave | Qué hace |
|-------|----------|
| `preDeployCommand` | `init-app.sh`: cache config/rutas/vistas, migraciones, `storage:link`, prueba SMTP opcional |
| `startCommand` | `start.sh` según `ABCARS_PROCESS_ROLE` |

**No hay `queue:work` ni `schedule:run` fijos en el toml.** El encolado de correos no se configura ahí: depende de `QUEUE_CONNECTION` y de un servicio con rol `queue`.

## Servicios recomendados

### 1. Backend API (web)

- Root: `abcars-backend`
- Variable: `ABCARS_PROCESS_ROLE=web` (o no definirla)
- **Sin** Cron Schedule
- Start efectivo: `php artisan serve`

### 2. Worker colas (correos y jobs)

- Mismo repo y root `abcars-backend`, mismas env que el API (`APP_KEY`, `DB_*`, `MAIL_*`, `QUEUE_CONNECTION=database`)
- Variable: **`ABCARS_PROCESS_ROLE=queue`**
- **Sin** cron (proceso continuo)
- Start efectivo: `php artisan queue:work`

Correos en cola relevantes: valuaciones (`AppointmentService` usa `dispatch()`), jobs `UploadVehicleImage`, webhooks en `LeadController`, etc.

### 3. Worker scheduler (Intelimotor u otras tareas en `bootstrap/app.php`)

- Variable: **`ABCARS_PROCESS_ROLE=scheduler`**
- Cron Schedule: `*/5 * * * *` (mínimo Railway ~5 min)
- Start efectivo en cada tick: `php artisan schedule:run`
- Panel Intelimotor: sincronización automática habilitada + intervalo guardado

## `init-app.sh` y correo

- Migraciones y cachés en **cada** deploy de cada servicio que comparte este repo.
- Prueba SMTP en deploy solo si `RAILWAY_DEPLOY_MAIL_TEST=1` y `MAIL_DEPLOY_TEST_TO` (`send-deploy-test-mail.sh`).

## Alternativa: otro `railway.toml` por servicio

En **Settings → Config file path** del worker puedes apuntar a otro archivo (ej. `abcars-backend/railway.scheduler.toml`) con otro `startCommand`, sin tocar el del API.
