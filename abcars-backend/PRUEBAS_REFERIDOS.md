# Pruebas de solicitudes con referido

Guía para probar el flujo de referidos y ver las solicitudes en las vistas del vendedor.

## Requisitos previos

- Backend corriendo (ej: `php artisan serve` en puerto 8000)
- Al menos un usuario con rol `seller` en la base de datos

## Opción 1: Comando Artisan (recomendado)

La forma más rápida de crear solicitudes de prueba:

```bash
cd abcars-backend
php artisan referral:create-test --count=3
```

Opciones:
- `--seller=UUID` - Usar un seller específico (por defecto usa el primero)
- `--count=N` - Crear N solicitudes (por defecto 1)

Las solicitudes aparecerán en **Mis referidos** al iniciar sesión como vendedor.

## Opción 2: Script bash (vía API)

### 1. Obtener el UUID de un vendedor

```bash
cd abcars-backend
php artisan referral:get-seller-uuid
```

Esto lista todos los sellers con su UUID. Si no hay sellers, ejecuta:

```bash
php artisan db:seed --class=ChevroletSellersSeeder
```

### 2. Ejecutar la prueba

```bash
./test-referral-requests.sh UUID_DEL_SELLER
```

O con variable de entorno:

```bash
REFERRER_UUID=xxx-xxx-xxx ./test-referral-requests.sh
```

### 3. Verificar en el dashboard

1. Inicia sesión en el frontend como el vendedor (seller)
2. Ve a **Dashboard** > **Mis referidos** (o **Solicitudes de mis referidos**)
3. La solicitud de prueba debería aparecer en la tabla

## Opción 3: Prueba manual desde el navegador

### 1. Obtener el link de referido

Desde el dashboard del vendedor, copia el "Link de referidos" o construye manualmente:

```
http://localhost:4200/inventario?ref=UUID_DEL_SELLER
```

O para un vehículo específico:

```
http://localhost:4200/vehiculo/UUID_VEHICULO?ref=UUID_DEL_SELLER
```

### 2. Abrir el link en ventana de incógnito

Abre el link en una ventana de incógnito (o sin estar logueado como vendedor) para simular un visitante externo.

### 3. Solicitar valuación

1. Navega a la página de valuación (desde el inventario o directamente)
2. El parámetro `?ref=` se guarda automáticamente en `sessionStorage`
3. Completa el formulario de valuación y envía
4. La solicitud se asociará al vendedor referrer

### 4. Verificar en el dashboard del vendedor

Inicia sesión como vendedor y revisa:
- **Mis referidos**: citas externas generadas desde sus links
- **Citas de valuación**: (si el valuator tiene esa vista filtrada por referrer)

## Estructura de la prueba (script)

El script `test-referral-requests.sh` hace:

1. **Registrar cliente**: `POST /api/auth/iternally_register` (sin auth)
2. **Crear cita**: `POST /api/appointment` con `referrer_uuid` en el body

La cita queda en `app_abcars_customer_appointments` con `referrer_user_id` asignado.

## Troubleshooting

- **"No se encontraron vendedores"**: Ejecuta `php artisan db:seed --class=ChevroletSellersSeeder`
- **"No se pudo obtener customer_uuid"**: Verifica que el backend responda correctamente en `/api/auth/iternally_register`
- **HTTP 422 en appointment**: Revisa que `referrer_uuid` exista en la tabla `users` y tenga rol seller
- **Las solicitudes no aparecen**: Confirma que iniciaste sesión como el seller correcto (el del UUID usado)
