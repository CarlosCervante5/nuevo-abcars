# Setup Evolution API — CarWash (sandbox)

## Servidor

- Evolution: `https://evolution-api-production-fb0a5.up.railway.app`
- Instancia: `abcars-carwash`
- Manager: `https://evolution-api-production-fb0a5.up.railway.app/manager`

## Railway (API sandbox ABCars)

```bash
CARWASH_WHATSAPP_PROVIDER=evolution
EVOLUTION_API_URL=https://evolution-api-production-fb0a5.up.railway.app
EVOLUTION_API_KEY=<AUTHENTICATION_API_KEY de Evolution>
EVOLUTION_INSTANCE=abcars-carwash
EVOLUTION_WEBHOOK_SECRET=abcars-cw-wh-3fb5a426366be2e9
OPENAI_API_KEY=<clave OpenAI>
```

## Webhook (ya configurado en Evolution)

- Evento: `MESSAGES_UPSERT`
- URL: `https://nuevo-abcars-sandbox.up.railway.app/api/webhooks/evolution/whatsapp?secret=abcars-cw-wh-3fb5a426366be2e9`

## Activar el número

1. Abre el Manager Evolution.
2. Entra a la instancia `abcars-carwash`.
3. Escanea el QR con WhatsApp (Dispositivos vinculados).
4. Confirma estado `open`:
   ```bash
   curl -H "apikey: $EVOLUTION_API_KEY" \
     https://evolution-api-production-fb0a5.up.railway.app/instance/connectionState/abcars-carwash
   ```

## DB + queue en sandbox

```bash
php artisan migrate
php artisan db:seed --class=CarWashSeeder
php artisan queue:work   # si QUEUE_CONNECTION=database
```

## Usuarios demo (CarWashSeeder)

| Rol | Email | Password | Nickname |
|-----|-------|----------|----------|
| Supervisor lavadores | `carwash_supervisor@abcars.mx` | `CarWashSupervisor%2026%%` | `carwash_supervisor` |
| Lavador | `carwash_lavador@abcars.mx` | `CarWashLavador%2026%%` | `carwash_lavador` |

```bash
php artisan db:seed --class=CarWashSeeder
```
