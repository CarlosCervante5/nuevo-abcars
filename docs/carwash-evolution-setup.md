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

## Prueba

1. Escribe al WhatsApp vinculado: “Hola, quiero agendar un lavado”.
2. Admin → CarWash WhatsApp (bandeja).
3. Al marcar una cita como `ready` en el tablero, debe salir notificación por WhatsApp.
