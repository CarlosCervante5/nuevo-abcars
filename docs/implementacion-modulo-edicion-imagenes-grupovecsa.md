# Documentación: módulo de edición de imágenes con IA (referencia para GrupoVecsa)

Este documento describe cómo está implementado en **ABCars** el flujo de **edición / reprocesamiento de imágenes de galería** con **Google Gemini (imagen)** y los elementos de soporte (proxy CORS, entorno, permisos). Sirve como guía para replicar o adaptar el módulo en **GrupoVecsa** u otro monorepo similar (Angular + Laravel).

---

## 1. Objetivo del módulo

- Permitir al usuario del panel (marketing / inventario) **subir fotos** de un vehículo y, opcionalmente, **pasarlas por IA** antes de guardarlas (recorte tipo estudio + fondo ciclorama + embellecimiento ligero).
- Permitir **reprocesar una imagen ya subida** (misma posición en la galería): descargar la URL actual, enviarla a Gemini, subir el resultado y **restaurar el orden** de la galería.

La IA se invoca **desde el navegador** hacia la API de Google (`generativelanguage.googleapis.com`), usando una **clave de API** inyectada en el build del frontend (no sustituye un backend propio de “modelo”; solo orquesta la petición).

---

## 2. Arquitectura resumida

| Capa | Responsabilidad |
|------|-----------------|
| **Angular** | UI de galería, confirmaciones (SweetAlert2), `GeminiVehicleImageService` (POST a Gemini), `fetchImageAsFile` (descarga segura vía API si la URL es CDN sin CORS), `VehicleGalleryReplaceService` (borrar + subir + reordenar). |
| **Laravel** | Autenticación Sanctum, CRUD de imágenes existente, **proxy HTTPS** `GET /api/media/fetch-image?url=` para hosts permitidos (CloudFront, Cloudinary, etc.). |
| **Google Gemini** | Modelo de imagen configurado en código (p. ej. `gemini-3.1-flash-image-preview`); prompts en español + sufijo técnico en inglés. |

Flujo “reprocesar fila”:

1. Usuario confirma en modal.
2. `fetchImageAsFile(service_image_url)` → si es CDN sin CORS, `GET {apiUrl}/api/media/fetch-image?url=...` con `Authorization: Bearer`.
3. `GeminiVehicleImageService.processFilesRecorteEmbellecer([File])` → POST a Gemini con imagen en base64.
4. `VehicleGalleryReplaceService.replaceAtIndex(...)` → borrar imagen antigua, subir nueva, `changeOrder` para dejarla en el mismo índice.

---

## 3. Backend (Laravel)

### 3.1 Archivos de referencia en ABCars

- `config/external_image_proxy.php` — lista de patrones `fnmatch()` para el **host** de la URL (variable de entorno `EXTERNAL_IMAGE_PROXY_ALLOWED_HOSTS`; por defecto incluye `*.cloudfront.net` y Cloudinary).
- `app/Http/Controllers/Media/ImageFetchProxyController.php` — valida `url` (solo `https`, host permitido, tamaño máximo, `Content-Type` imagen), descarga con `Http::` y devuelve bytes.
- `routes/api.php` — grupo `prefix('media')` + `middleware(['auth:sanctum', 'role_or_permission:...'])` y ruta `GET /fetch-image` → `ImageFetchProxyController@fetch`.  
  La URL pública resultante es: **`{API_ORIGIN}/api/media/fetch-image?url={encodeURIComponent(url)}`**.

### 3.2 Seguridad al portar a GrupoVecsa

- **Nunca** aceptar hosts arbitrarios sin lista blanca (SSRF).
- Limitar tamaño de respuesta y tiempo de espera (ABCars usa orden de magnitud 15 MB y timeout ~60 s).
- Mantener **solo HTTPS** hacia el origen de la imagen.
- Alinear `role_or_permission` con los roles de quien puede editar inventario / multimedia.

---

## 4. Frontend (Angular)

### 4.1 Servicios y utilidades clave

| Archivo | Rol |
|---------|-----|
| `src/app/shared/services/gemini-vehicle-image.service.ts` | Construye URL de `generateContent`, ensambla body con `inline_data`, reintentos, timeouts; métodos `processFilesRecorteEmbellecer`, `processHypEvidenceFiles`, etc. |
| `src/app/shared/utils/fetch-image-as-file.ts` | Descarga URL a `File`; si el host es CDN típico (p. ej. `*.cloudfront.net`, Cloudinary), usa el **proxy Laravel** con token; normaliza URLs `//host` → `https://host`. |
| `src/app/shared/utils/studio-catalog-background.ts` | Texto de referencia del **ciclorama** de catálogo (colores / continuidad); asset SVG opcional para composición en canvas. |
| `src/app/shared/services/vehicle-gallery-replace.service.ts` | Orquesta delete + upload + `changeOrder` conservando posición. |
| `src/app/shared/services/images.service.ts` | `deleteImage`, `setImage`, `changeOrder` (ya existentes en el dominio vehículo). |

### 4.2 UI integrada (inventario marketing)

- `store-vehicle` y `update-vehicle` (módulo `vehicle-inventory.module.ts`): pestaña **Imágenes**, botón varita por fila, estado `galleryReplacing` + `galleryReplacingIndex`, spinner Material.
- Flujo “subir con IA antes de enviar”: usa el mismo `GeminiVehicleImageService` sobre `File[]` locales (sin proxy de URL).

### 4.3 Desarrollo local: evitar CORS con Gemini

- `environment.ts`: `geminiUseDevProxy: true`, `geminiApiKey` rellenada.
- `proxy.conf.json`: prefijo `/gemini-api` → `https://generativelanguage.googleapis.com` con `pathRewrite` que quita el prefijo.
- `angular.json` → target `serve` con `proxyConfig: "proxy.conf.json"`.
- En `GeminiVehicleImageService`, si `!production && geminiUseDevProxy`, la URL de generación es relativa `/gemini-api/...` para pasar por el proxy del `ng serve`.

En **producción**, `geminiUseDevProxy: false` y la app llama directo a `geminiApiBaseUrl` con cabecera `x-goog-api-key`.

### 4.4 Build / despliegue (ej. Railway)

- Script `scripts/generate-env-railway.js` escribe `environment.ts` y `environment.production.ts` desde variables: **`API_URL`** (obligatoria), **`GEMINI_API_KEY`**, opcionales `GEMINI_API_BASE_URL`, `IMAGEN_STUDIO_URL`.
- El **frontend** debe recibir `GEMINI_API_KEY` en el **job de build** del sitio estático (no solo en el contenedor del backend Laravel).

Plantilla local versionada: `src/environments/environment.example.ts`.

---

## 5. Variables de entorno (checklist GrupoVecsa)

**Frontend (build)**

- `API_URL` — origen del API Laravel (sin barra final inconsistente; el código suele hacer `replace(/\/$/, '')`).
- `GEMINI_API_KEY` — clave de Google AI Studio / Vertex según corresponda.
- Opcional: `GEMINI_API_BASE_URL` (por defecto `https://generativelanguage.googleapis.com`).

**Backend (runtime)**

- `EXTERNAL_IMAGE_PROXY_ALLOWED_HOSTS` — p. ej. `*.cloudfront.net,*.cloudinary.com,res.cloudinary.com` (ajustar a los CDN reales de GrupoVecsa).

---

## 6. Contratos de API que debe cumplir el backend de vehículos

El módulo asume (como en ABCars) que existen endpoints ya integrados con el modelo de imágenes del vehículo:

- Detalle vehículo con `images[]` que incluyan al menos `uuid`, `sort_id`, `service_image_url`, `service_public_id`.
- Borrar imagen por UUID de imagen.
- Subir imágenes al vehículo.
- Reordenar galería enviando la lista ordenada de `{ id/uuid, sort_id, path, path_public, external_website }` (o el contrato equivalente en GrupoVecsa).

Si los nombres de campos difieren, adaptar solo el mapeo en los componentes / `VehicleGalleryReplaceService`, no la lógica de Gemini.

---

## 7. App opcional `abcars-imagen-studio` (Vite + React)

Proyecto aparte para pruebas rápidas de prompts y mismas ideas de **recorte + sufijo técnico** (`src/studio/imagePrompts.ts`, `src/google/geminiImage.ts`). No es obligatorio para el panel Angular; útil como laboratorio de prompts y clave `VITE_GEMINI_API_KEY`.

---

## 8. Prompts y ciclorama (criterio de producto)

- Objetivo: **fondo 100 % ciclorama** de catálogo (sin dejar techo o sala original difuminada arriba).
- Textos centralizados en `STUDIO_CATALOG_COLOR_HINT` + `PROMPT_RECORTE` + `STUDIO_RECORTE_SUFFIX` en `gemini-vehicle-image.service.ts` (y espejo en imagen-studio si se mantiene alineado).

Al portar a GrupoVecsa, conviene **versionar** los prompts en un solo módulo o constantes compartidas para poder afinarlos sin tocar la UI.

---

## 9. Errores frecuentes y mitigación

| Síntoma | Causa probable | Acción |
|---------|----------------|--------|
| CORS al cargar imagen desde CDN | `fetch` directo a CloudFront/S3 sin cabeceras | Usar proxy autenticado + lista blanca de hosts; normalizar URLs `//`. |
| CORS solo en desarrollo con Gemini | Llamada directa a Google desde `localhost` | Activar `geminiUseDevProxy` + `proxy.conf.json`. |
| Chunk `.js` con MIME `text/html` | SPA sirve `index.html` para rutas inexistentes o caché de `index.html` | `Cache-Control` en `index.html` en el servidor estático; despliegue atómico; `serve.json` en ABCars. |
| 403 en `/api/media/fetch-image` | Host no en lista blanca | Ampliar `EXTERNAL_IMAGE_PROXY_ALLOWED_HOSTS`. |
| IA “no disponible” | `geminiApiKey` vacía en el build | Inyectar clave en CI del frontend. |

---

## 10. Checklist de portación a GrupoVecsa

1. [ ] Copiar/adaptar **proxy de imágenes** (config + controller + ruta + permisos).
2. [ ] Añadir **`fetchImageAsFile`** (o equivalente) y usarlo siempre que la entrada sea URL remota de CDN.
3. [ ] Incorporar **`GeminiVehicleImageService`** (o servicio único de IA imagen) con modelo y prompts acordados.
4. [ ] Implementar **`replaceAtIndex`** (o flujo equivalente: delete → upload → reorder) contra la API de GrupoVecsa.
5. [ ] Variables de entorno en **build** del SPA y en **runtime** del API.
6. [ ] UI: confirmación, deshabilitar doble clic, **spinner** en la acción larga.
7. [ ] Pruebas manuales: imagen en CloudFront, imagen local, error de red, 403 proxy.

---

## 11. Referencia de rutas en el repo ABCars

```
abcars-backend/
  app/Http/Controllers/Media/ImageFetchProxyController.php
  config/external_image_proxy.php
  routes/api.php  →  GET api/media/fetch-image

abcars-frontend/
  src/app/shared/services/gemini-vehicle-image.service.ts
  src/app/shared/services/vehicle-gallery-replace.service.ts
  src/app/shared/utils/fetch-image-as-file.ts
  src/app/shared/utils/studio-catalog-background.ts
  src/app/admin/marketing/components/store-vehicle/*
  src/app/admin/marketing/components/update-vehicle/*
  proxy.conf.json
  scripts/generate-env-railway.js
  src/environments/environment.example.ts

abcars-imagen-studio/   (opcional)
  src/studio/imagePrompts.ts
  src/google/geminiImage.ts
```

---

*Documento generado como referencia de implementación; ajustar nombres de roles, rutas y DTOs a la convención real de GrupoVecsa.*
