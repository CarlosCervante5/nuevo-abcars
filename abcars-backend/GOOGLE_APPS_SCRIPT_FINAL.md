# Código Final de Google Apps Script - Mapeo Completo

## Estructura de Columnas en Google Sheet

- **A**: Sucursal
- **B**: Tipo
- **C**: Canal ← Debe ser "abcars.mx"
- **D**: Campaña o submedio
- **E**: ID L
- **F**: ID d
- **G**: ID CRM
- **H**: Prefijo
- **I**: Nombre(s)
- **J**: Apellidos
- **K**: Teléfono
- **L**: Correo

## Código Completo del Google Apps Script

```javascript
function doPost(e) {
  try {
    // Obtener la hoja activa
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    // O si tienes una hoja específica:
    // var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('NombreDeTuHoja');
    
    // Obtener los parámetros enviados desde el formulario
    var params = e.parameters;
    
    // IMPORTANTE: El orden del array DEBE coincidir EXACTAMENTE con el orden de las columnas
    // JavaScript usa índices base 0, así que:
    // Columna A = índice 0, Columna B = índice 1, Columna C = índice 2, etc.
    
    var rowData = [
      params.sucursal ? params.sucursal[0] : '', // A: Sucursal
      params.formType ? params.formType[0] : '', // B: Tipo (financing, testDrive, offer, valuation)
      params.canal ? params.canal[0] : 'abcars.mx', // C: Canal - SIEMPRE "abcars.mx"
      '', // D: Campaña o submedio (vacío por defecto)
      '', // E: ID L (vacío por defecto)
      '', // F: ID d (vacío por defecto)
      '', // G: ID CRM (vacío por defecto)
      '', // H: Prefijo (vacío por defecto)
      params.nombre ? params.nombre[0] : '', // I: Nombre(s)
      params.apellido ? params.apellido[0] : '', // J: Apellidos
      params.telefono ? params.telefono[0] : '', // K: Teléfono
      params.correo ? params.correo[0] : '', // L: Correo
      // Campos adicionales (ajusta según tus columnas adicionales)
      params.marca ? params.marca[0] : '',
      params.modelo ? params.modelo[0] : '',
      params.año ? params.año[0] : '',
      params.fecha ? params.fecha[0] : '',
      params.precio_vehiculo ? params.precio_vehiculo[0] : '',
      params.enganche ? params.enganche[0] : '',
      params.mensualidad ? params.mensualidad[0] : '',
      params.plazo_meses ? params.plazo_meses[0] : '',
      params.monto_ofrecido ? params.monto_ofrecido[0] : '',
      params.fecha_preferida ? params.fecha_preferida[0] : '',
      params.hora_preferida ? params.hora_preferida[0] : '',
      params.kilometraje ? params.kilometraje[0] : '',
      params.comentarios ? params.comentarios[0] : ''
    ];
    
    // USAR appendRow() - Esto automáticamente agrega en la siguiente fila vacía
    sheet.appendRow(rowData);
    
    // Retornar respuesta exitosa con información de debug
    return ContentService.createTextOutput(JSON.stringify({
      'result': 'success',
      'row': sheet.getLastRow(),
      'sucursal': params.sucursal ? params.sucursal[0] : 'NO RECIBIDO',
      'canal': params.canal ? params.canal[0] : 'NO RECIBIDO'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    // En caso de error, retornar información del error
    return ContentService.createTextOutput(JSON.stringify({
      'result': 'error',
      'message': error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
```

## Puntos Críticos

1. **Columna A (índice 0)**: `params.sucursal[0]` - Recibe el campo `sucursal` del backend
2. **Columna C (índice 2)**: `params.canal[0]` o `'abcars.mx'` - Debe ser siempre "abcars.mx"
3. **Orden del array**: Debe coincidir EXACTAMENTE con el orden de las columnas en tu Google Sheet

## Verificación

Después de actualizar el script:
1. Guarda el proyecto en Google Apps Script
2. Envía un lead de prueba desde el backend
3. Verifica en Google Sheets que:
   - El registro aparece en la siguiente fila vacía
   - La columna A ("Sucursal") contiene el valor enviado (actualmente vacío)
   - La columna C ("Canal") contiene "abcars.mx"
   - Los demás campos están en sus columnas correctas

## Debug

Si aún no funciona, revisa la respuesta del webhook en los logs del backend. Deberías ver:
```json
{
  "result": "success",
  "row": 27,
  "sucursal": "",
  "canal": "abcars.mx"
}
```

Si `sucursal` o `canal` aparecen como "NO RECIBIDO", significa que el Google Apps Script no está recibiendo esos parámetros correctamente.

## Nota sobre Sucursal

Actualmente el backend envía `sucursal` como vacío (`''`). Si necesitas un valor por defecto específico (por ejemplo, "Pachuca"), puedes:
1. Cambiarlo en el backend en `LeadController.php` (línea donde dice `'sucursal' => ''`)
2. O agregarlo como fallback en el Google Apps Script: `params.sucursal ? params.sucursal[0] : 'Pachuca'`


