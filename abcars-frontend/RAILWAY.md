# Desplegar abcars-frontend en Railway

Guía para desplegar el frontend Angular en el mismo proyecto Railway donde está el backend.

---

## 1. Crear el servicio del frontend

- En tu proyecto de Railway (donde ya está el backend), **Add Service** → **GitHub Repo** y elige el mismo repositorio (`nuevo-abcars`).
- En el **nuevo servicio** → **Settings** → **Source**:
  - **Root Directory:** `abcars-frontend`
- Así Railway usará solo la carpeta del frontend para build y deploy. El `railway.toml` de esta carpeta define el build y el start.

---

## 2. Variables de entorno

En el servicio del frontend → **Variables** → **Add Variable**:

| Variable   | Valor | Obligatorio |
|------------|-------|-------------|
| `API_URL`  | URL pública del backend en Railway. Ejemplo: `https://nuevo-abcars-backend.up.railway.app` (sin barra final) | Sí |

No hace falta definir `PORT`; Railway la inyecta y el script `start` la usa.

---

## 3. Build y deploy

- **Build:** lo define `railway.toml`: `npm install && npm run build:railway` (genera el env con `API_URL` y hace el build de producción). Se usa `npm install` en lugar de `npm ci` para evitar conflicto con la caché de Nixpacks (EBUSY).
- **Start:** `npm start` (sirve la app con `serve`).
- Si el backend está en otro servicio del mismo proyecto, copia la URL del dominio del backend y pégala en `API_URL`.

---

## 4. CORS en el backend

Para que el navegador permita peticiones desde el frontend en Railway, el **backend** debe permitir el origen del frontend:

- En el servicio del **backend** en Railway, revisa la variable que usa Laravel para CORS (por ejemplo `FRONTEND_URL`).
- Pon como valor la URL del frontend en Railway, por ejemplo: `https://nuevo-abcars-frontend.up.railway.app`

---

## 5. Probar

- Abre la URL del frontend que Railway asigna (o tu dominio personalizado).
- Navega y prueba una acción que llame al API (por ejemplo login o listado); revisa que no haya errores de CORS en la consola del navegador.
