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

## Importante: versión Evolution (causa de la 1 palomita)

El servidor actual es **Evolution API 2.3.7** (Baileys `7.0.0-rc.9`). Esa versión deja los envíos en `PENDING` (una palomita) y el cliente **no recibe** la respuesta del bot, aunque el webhook sí llegue.

### Fix recomendado (Railway del servicio Evolution)

Desplegar la imagen overlay del repo:

- Carpeta: `infra/evolution-overlay/Dockerfile`
- Base: `evoapicloud/evolution-api:v2.3.7` + `baileys@7.0.0-rc13`

En Railway (proyecto Evolution):

1. Settings → Build → Dockerfile path = `infra/evolution-overlay/Dockerfile` (o el root de ese overlay).
2. Redesplegar.
3. Abrir Manager → instancia `abcars-carwash` → escanear QR otra vez.
4. Confirmar `connectionState` = `open`.
5. Probar un mensaje: el status ya no debe quedarse en `PENDING`.

Alternativa: imagen `evoapicloud/evolution-api:2.4.0-rc2` (probar en sandbox; puede requerir re-pareo).

Mientras tanto el backend ABCars:
- resuelve chats `@lid` → teléfono real (`remoteJidAlt`)
- procesa el webhook en el mismo request (no solo `afterResponse`)
- no reescribe a la fuerza números `52…` a `521…` (rompe JIDs reales)
- guarda `@lid` para reenviar por ese JID

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
