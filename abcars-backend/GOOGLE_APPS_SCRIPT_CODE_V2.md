# Código de Google Apps Script - Versión con Mapeo Correcto de Columnas

## Problema Identificado

El campo `canal` se está enviando desde el backend pero no aparece en la columna C del Google Sheet porque el script no está mapeando correctamente los campos a las columnas.

## Estructura de Columnas en Google Sheet

Según la imagen proporcionada, las columnas son:
- **A**: Sucursal
- **B**: Tipo
- **C**: Canal ← **IMPORTANTE: Aquí debe ir "abcars.mx"**
- **D**: Campaña o submedio
- **E**: ID L
- **F**: ID d
- **G**: ID CRM
- **H**: Prefijo
- **I**: Nombre(s)
- **J**: Apellidos
- **K**: Teléfono
- **L**: Correo
- **M+**: Otros campos adicionales (marca, modelo, año, etc.)

## Código Corregido del Google Apps Script

```javascript
function doPost(e) {
  try {
    // Obtener la hoja activa
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    // O si tienes una hoja específica:
    // var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('NombreDeTuHoja');
    
    // Obtener los parámetros enviados desde el formulario
    var params = e.parameters;
    
    // IMPORTANTE: El orden del array debe coincidir EXACTAMENTE con el orden de las columnas en tu Google Sheet
    // Mapeo según las columnas:
    // A=Sucursal, B=Tipo, C=Canal, D=Campaña, E=ID L, F=ID d, G=ID CRM, H=Prefijo, I=Nombre, J=Apellidos, K=Teléfono, L=Correo
    
    var rowData = [
      params.sucursal ? params.sucursal[0] : '', // A: Sucursal
      params.formType ? params.formType[0] : '', // B: Tipo (financing, testDrive, offer, valuation)
      params.canal ? params.canal[0] : 'abcars.mx', // C: Canal - SIEMPRE debe ser "abcars.mx"
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
    
    // Retornar respuesta exitosa
    return ContentService.createTextOutput(JSON.stringify({
      'result': 'success',
      'row': sheet.getLastRow(),
      'canal': params.canal ? params.canal[0] : 'abcars.mx'
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

1. **Columna C (índice 2 en el array)**: Debe contener `params.canal[0]` o `'abcars.mx'` por defecto
2. **Orden del array**: Debe coincidir EXACTAMENTE con el orden de las columnas en tu Google Sheet
3. **Índices del array**: JavaScript usa índices base 0, así que:
   - Columna A = índice 0
   - Columna B = índice 1
   - Columna C = índice 2 ← **Aquí va el canal**
   - Columna D = índice 3
   - etc.

## Cómo Ajustar para tu Hoja Específica

1. Identifica todas tus columnas en orden (A, B, C, D, E, F, G, H, I, J, K, L, M, N, O...)
2. Mapea cada campo del formulario a su columna correspondiente
3. Asegúrate de que la columna C (índice 2) contenga: `params.canal ? params.canal[0] : 'abcars.mx'`

## Verificación

Después de actualizar el script:
1. Guarda el proyecto en Google Apps Script
2. Envía un lead de prueba desde el backend
3. Verifica en Google Sheets que:
   - El registro aparece en la siguiente fila vacía
   - La columna C ("Canal") contiene "abcars.mx"
   - Los demás campos están en sus columnas correctas

## Debug

Si aún no funciona, puedes agregar logs temporales en el script:

```javascript
// Agregar antes de appendRow para debug
Logger.log('Canal recibido: ' + (params.canal ? params.canal[0] : 'NO RECIBIDO'));
Logger.log('Array completo: ' + JSON.stringify(rowData));
```

Luego revisa los logs en **Ejecuciones** en Google Apps Script.

