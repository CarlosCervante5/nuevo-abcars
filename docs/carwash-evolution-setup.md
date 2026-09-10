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

1. Abre el Manager Evolution: https://evolution-api-production-fb0a5.up.railway.app/manager
2. Entra a la instancia `abcars-carwash`.
3. Escanea el QR con WhatsApp (Dispositivos vinculados) del número del bot.
4. Confirma estado `open`:
   ```bash
   curl -H "apikey: $EVOLUTION_API_KEY" \
     https://evolution-api-production-fb0a5.up.railway.app/instance/connectionState/abcars-carwash
   ```

> Si el estado es `connecting` (no `open`), los mensajes salen con **una sola palomita** y no se entregan. Hay que volver a escanear el QR.

## Importante: versión Evolution

El servidor actual es **Evolution API 2.3.7** (Baileys `7.0.0-rc.9`). Esa versión tiene un bug conocido: mensajes privados quedan en `PENDING` / una palomita, sobre todo con chats `@lid`.

Recomendado: actualizar Evolution a una imagen/build con **Baileys ≥ 7.0.0-rc13** (rama develop / releases posteriores a ese bump).

Mientras tanto el backend:
- bloquea envíos si la instancia no está `open`
- guarda el `@lid` del contacto y lo usa al responder
- formatea números MX como `521…`

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
php artisan carwash:ensure-staff
# o
php artisan db:seed --class=CarWashSeeder
```

Bootstrap remoto (sandbox, con secret):

```bash
curl -X POST "https://nuevo-abcars-sandbox.up.railway.app/api/webhooks/carwash/bootstrap-staff?secret=$EVOLUTION_WEBHOOK_SECRET" \
  -H "Accept: application/json"
```
