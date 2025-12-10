# Configuración de Variables de Entorno para Formularios

## Variables de Entorno Requeridas

Para que los formularios de contacto funcionen correctamente, es necesario configurar la siguiente variable de entorno en el archivo `.env` del backend:

### Webhook de Google Sheets

Todos los formularios utilizan la misma variable de entorno para enviar datos a Google Sheets:

```env
# Webhook de Google Sheets para todos los formularios de contacto
GOOGLE_SHEET_WEBHOOK_PRICE_OFFER="https://script.google.com/macros/s/AKfycby6Bwqp5RI2o6QkcEcxaCvDUai3AFjXi3fgrkYmf3emm9InTRZQk6ZD833YFzNtCbc/exec"
```

## Formularios Integrados

Todos los siguientes formularios están conectados a Google Sheets usando la misma variable de entorno `GOOGLE_SHEET_WEBHOOK_PRICE_OFFER`:

1. **Financiamiento** (`/api/leads/financing`)
   - Campos: nombre, apellido, teléfono, email, dirección, ocupación, ingresos, empresa, antigüedad, datos del vehículo, enganche, mensualidad, plazo
   - Variable: `GOOGLE_SHEET_WEBHOOK_PRICE_OFFER`

2. **Prueba de Manejo** (`/api/leads/test_drive`)
   - Campos: nombre, teléfono, email, fecha preferida, hora preferida, datos del vehículo
   - Variable: `GOOGLE_SHEET_WEBHOOK_PRICE_OFFER`

3. **Ofrecer Monto** (`/api/leads/offer`)
   - Campos: nombre, teléfono, email, monto ofrecido, condiciones de pago, datos del vehículo
   - Variable: `GOOGLE_SHEET_WEBHOOK_PRICE_OFFER`

4. **Valuación** (`/api/leads/valuation`)
   - Campos: nombre, apellido, teléfono, email, marca, modelo, año, kilometraje, ciudad, fecha/hora preferida
   - Variable: `GOOGLE_SHEET_WEBHOOK_PRICE_OFFER`

## Formato de Datos

Los datos se envían a Google Sheets mediante Google Apps Script en formato form-data con la siguiente estructura:

```php
[
  'formType' => 'financing|testDrive|offer|valuation',
  'fecha' => '2024-01-15 14:30:00',
  'nombre' => '...',
  'telefono' => '...',
  'correo' => '...',
  // ... otros campos específicos del formulario
  'comentarios' => 'Información adicional concatenada'
]
```

## Instrucciones de Configuración

1. Agrega la variable `GOOGLE_SHEET_WEBHOOK_PRICE_OFFER` al archivo `.env` del backend con la URL del Google Apps Script
2. Reinicia el servidor Laravel para que los cambios surtan efecto
3. Todos los formularios utilizarán automáticamente esta variable
4. **IMPORTANTE**: Asegúrate de que tu Google Apps Script use `appendRow()` o `getLastRow() + 1` para agregar datos en la siguiente fila vacía. Ver el archivo `GOOGLE_APPS_SCRIPT_CODE.md` para el código correcto.

## Problema Común: Datos se agregan en la última fila con datos

Si los leads se están agregando en la última fila que tiene datos (en lugar de la siguiente fila vacía), el script de Google Apps Script necesita ser actualizado. Ver `GOOGLE_APPS_SCRIPT_CODE.md` para la solución y el código corregido.

## Nota

Si la variable no está configurada, el sistema no enviará datos a Google Sheets pero no generará error. El formulario se procesará normalmente y retornará éxito, pero los datos no se enviarán al webhook de Google Sheets.

