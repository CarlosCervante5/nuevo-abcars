# Configuración de Variables de Entorno para Formularios

## Variables de Entorno Requeridas

Para que los formularios de contacto funcionen correctamente, es necesario configurar las siguientes variables de entorno en el archivo `.env` del backend:

### Webhooks de Zapier

Agrega las siguientes variables con las URLs de tus webhooks de Zapier:

```env
# Webhooks de Zapier para formularios de contacto
ZAPIER_WEBHOOK_FINANCING=https://hooks.zapier.com/hooks/catch/TU_WEBHOOK_ID_FINANCIAMIENTO
ZAPIER_WEBHOOK_TEST_DRIVE=https://hooks.zapier.com/hooks/catch/TU_WEBHOOK_ID_PRUEBA_MANEJO
ZAPIER_WEBHOOK_OFFER=https://hooks.zapier.com/hooks/catch/TU_WEBHOOK_ID_OFERTA
ZAPIER_WEBHOOK_VALUATION=https://hooks.zapier.com/hooks/catch/TU_WEBHOOK_ID_VALUACION
```

## Formularios Integrados

Los siguientes formularios están conectados a Zapier:

1. **Financiamiento** (`/api/leads/financing`)
   - Campos: nombre, apellido, teléfono, email, dirección, ocupación, ingresos, empresa, antigüedad, datos del vehículo, enganche, mensualidad, plazo
   - Variable: `ZAPIER_WEBHOOK_FINANCING`

2. **Prueba de Manejo** (`/api/leads/test_drive`)
   - Campos: nombre, teléfono, email, fecha preferida, hora preferida, datos del vehículo
   - Variable: `ZAPIER_WEBHOOK_TEST_DRIVE`

3. **Ofrecer Monto** (`/api/leads/offer`)
   - Campos: nombre, teléfono, email, monto ofrecido, condiciones de pago, datos del vehículo
   - Variable: `ZAPIER_WEBHOOK_OFFER`

4. **Valuación** (`/api/leads/valuation`)
   - Campos: nombre, apellido, teléfono, email, marca, modelo, año, kilometraje, ciudad, fecha/hora preferida
   - Variable: `ZAPIER_WEBHOOK_VALUATION`

## Formato de Datos

Los datos se envían a Zapier en formato JSON con la siguiente estructura:

```json
{
  "formType": "financing|testDrive|offer|valuation",
  "fecha": "2024-01-15 14:30:00",
  "nombre": "...",
  "telefono": "...",
  "correo": "...",
  // ... otros campos específicos del formulario
  "comentarios": "Información adicional concatenada"
}
```

## Instrucciones de Configuración

1. Obtén las URLs de tus webhooks de Zapier desde tu cuenta de Zapier
2. Copia las URLs completas (incluyendo `https://hooks.zapier.com/hooks/catch/...`)
3. Agrega las variables al archivo `.env` del backend
4. Reinicia el servidor Laravel para que los cambios surtan efecto

## Nota

Si alguna variable no está configurada, el sistema no enviará datos a Zapier pero no generará error. El formulario se procesará normalmente y retornará éxito, pero los datos no se enviarán al webhook.

