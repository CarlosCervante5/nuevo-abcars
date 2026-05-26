# ABCars Valuation (Ionic + Capacitor)

App móvil / PWA para valuación e inventario. La API es Laravel (Railway u otro host).

Documentación completa del módulo de IA (backend + panel + móvil): **[docs/modulo-ia-imagenes-vehiculo.md](../docs/modulo-ia-imagenes-vehiculo.md)**.

## IA (Gemini) solo con el servidor en Railway

No es obligatorio poner `VITE_GEMINI_API_KEY` en el build. Si en **el mismo proyecto Railway** donde corre la API tienes **`GEMINI_API_KEY`**, la app:

1. Llama a `GET /api/studio-catalog/gemini/capabilities` (con tu sesión).
2. Si responde que el servidor tiene IA, activa el interruptor y el botón de reprocesar.
3. Envía la imagen a `POST /api/studio-catalog/gemini/generate-recorte` y el **servidor** llama a Google.

**Requisito:** la URL de la API en el bundle debe ser **exactamente** ese backend (mismo host que tiene la variable en Railway).

### 1. Configurar URL del API antes de compilar

Edita **`abcars-valuation-ionic/.env.production`**:

```env
VITE_API_BASE_URL=https://nuevo-abcars-production.up.railway.app/api/
```

(Sandbox de pruebas: `https://nuevo-abcars-sandbox.up.railway.app/api/`.)

- Debe acabar en `/api/` (o solo el dominio: el código puede añadir `/api`).
- Debe ser el servicio donde está **`GEMINI_API_KEY`** en Variables.

Opcional: **`abcars-valuation-ionic/.env.production.local`** (no se sube a git) para sobreescribir la URL o probar otro entorno.

**No subas claves Gemini al repositorio.** `VITE_GEMINI_API_KEY` en `.env.production` puede quedar vacío si usas solo el proxy.

### 2. Compilar web + sincronizar Android

Desde la carpeta `abcars-valuation-ionic`:

```bash
npm ci
npm run build:android
```

Eso ejecuta `tsc`, `vite build`, verifica que el `dist` contiene la URL de `.env.production` y hace `cap sync android`.

### 3. Generar el APK

```bash
cd android
./gradlew assembleRelease
```

El APK queda en `android/app/build/outputs/apk/release/app-release.apk`.

Para instalar en un dispositivo con USB:

```bash
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

(Ajusta la ruta si ejecutas `adb` desde otra carpeta.)

### 4. Comprobar que la IA se habilita

1. Abre la app, inicia sesión con un usuario que pueda **crear/actualizar vehículos** (misma lógica que subir fotos).
2. Entra a **Fotos** de un vehículo: al cargar la pantalla se vuelve a consultar `capabilities`.
3. Si sigue deshabilitado: en un navegador (con el mismo token o sesión) prueba  
   `GET https://TU-API/api/studio-catalog/gemini/capabilities`  
   y revisa que `data.server_gemini` sea `true`.

### Problemas frecuentes

| Síntoma | Qué revisar |
|--------|-------------|
| IA deshabilitada en Android, en web sí | Misma URL de API en `.env.production` que en web; `GEMINI_API_KEY` en **ese** servicio Railway; redeploy del backend. |
| 401 / sesión | Token válido; cerrar sesión y volver a entrar. |
| Quieres Gemini directo en el cliente | Solo entonces `VITE_GEMINI_API_KEY` en `.env.production.local` + nuevo `npm run build` (menos recomendable). |

## Desarrollo local

```bash
cp .env.example .env
# Edita .env con VITE_API_BASE_URL y opcional VITE_GEMINI_USE_DEV_PROXY=1 para dev
npm run dev
```
