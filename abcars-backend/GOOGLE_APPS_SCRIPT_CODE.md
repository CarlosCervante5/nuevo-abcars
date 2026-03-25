# Código de Google Apps Script para Google Sheets

## Problema Actual

Los leads están siendo agregados en la última fila que tiene datos, en lugar de la siguiente fila vacía.

## Solución

El script de Google Apps Script debe usar `appendRow()` o `getLastRow() + 1` para agregar datos en la siguiente fila vacía.

## Código Corregido

Aquí está el código que debe estar en tu Google Apps Script:

```javascript
function doPost(e) {
  try {
    // Obtener la hoja activa (o cambiar 'Sheet1' por el nombre de tu hoja)
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    // O si tienes una hoja específica:
    // var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('NombreDeTuHoja');
    
    // Obtener los parámetros enviados desde el formulario
    var params = e.parameters;
    
    // Crear un array con los valores a insertar
    // IMPORTANTE: Ajusta el orden según las columnas en tu Google Sheet
    // Según la imagen: A=Sucursal, B=Tipo, C=Canal, D=Campaña, E=ID L, F=ID d, G=ID CRM, H=Prefijo, I=Nombre, J=Apellidos, K=Teléfono, L=Correo
    
    var rowData = [
      '', // A: Sucursal (vacío por defecto)
      params.formType ? params.formType[0] : '', // B: Tipo (tipo de formulario)
      params.canal ? params.canal[0] : 'abcars.mx', // C: Canal (siempre 'abcars.mx')
      '', // D: Campaña o submedio (vacío por defecto)
      '', // E: ID L (vacío por defecto)
      '', // F: ID d (vacío por defecto)
      '', // G: ID CRM (vacío por defecto)
      '', // H: Prefijo (vacío por defecto)
      params.nombre ? params.nombre[0] : '', // I: Nombre(s)
      params.apellido ? params.apellido[0] : '', // J: Apellidos
      params.telefono ? params.telefono[0] : '', // K: Teléfono
      params.correo ? params.correo[0] : '', // L: Correo
      params.marca ? params.marca[0] : '', // M: Marca (si aplica)
      params.modelo ? params.modelo[0] : '', // N: Modelo (si aplica)
      params.año ? params.año[0] : '', // O: Año (si aplica)
      params.fecha ? params.fecha[0] : '', // P: Fecha (si aplica)
      params.precio_vehiculo ? params.precio_vehiculo[0] : '', // Q: Precio vehículo (si aplica)
      params.enganche ? params.enganche[0] : '', // R: Enganche (si aplica)
      params.mensualidad ? params.mensualidad[0] : '', // S: Mensualidad (si aplica)
      params.plazo_meses ? params.plazo_meses[0] : '', // T: Plazo meses (si aplica)
      params.monto_ofrecido ? params.monto_ofrecido[0] : '', // U: Monto ofrecido (si aplica)
      params.fecha_preferida ? params.fecha_preferida[0] : '', // V: Fecha preferida (si aplica)
      params.hora_preferida ? params.hora_preferida[0] : '', // W: Hora preferida (si aplica)
      params.kilometraje ? params.kilometraje[0] : '', // X: Kilometraje (si aplica)
      params.comentarios ? params.comentarios[0] : '' // Y: Comentarios (si aplica)
    ];
    
    // USAR appendRow() - Esto automáticamente agrega en la siguiente fila vacía
    sheet.appendRow(rowData);
    
    // Retornar respuesta exitosa
    return ContentService.createTextOutput(JSON.stringify({
      'result': 'success',
      'row': sheet.getLastRow()
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

## Alternativa: Usando getLastRow() + 1

Si prefieres usar `getLastRow()` con otra lógica, asegúrate de agregar `+ 1`:

```javascript
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var params = e.parameters;
    
    // ... preparar rowData como arriba ...
    
    // OPCIÓN 2: Usar getLastRow() + 1
    var lastRow = sheet.getLastRow();
    var nextRow = lastRow + 1; // IMPORTANTE: +1 para agregar en la siguiente fila vacía
    
    // Insertar en la siguiente fila vacía
    sheet.getRange(nextRow, 1, 1, rowData.length).setValues([rowData]);
    
    return ContentService.createTextOutput(JSON.stringify({
      'result': 'success',
      'row': nextRow
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      'result': 'error',
      'message': error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
```

## Recomendación

**Usa `appendRow()`** - Es más simple y siempre agrega en la siguiente fila vacía automáticamente.

## Pasos para Actualizar

1. Abre tu Google Sheet
2. Ve a **Extensiones** > **Apps Script**
3. Reemplaza el código existente con el código corregido de arriba
4. Ajusta los campos del array `rowData` según el orden de las columnas en tu hoja
5. Guarda el proyecto (Ctrl+S o Cmd+S)
6. Despliega como aplicación web si es necesario
7. Prueba enviando un nuevo lead desde el backend

## Verificación

Después de actualizar el script:
1. Envía un lead de prueba desde el backend
2. Verifica en Google Sheets que el nuevo registro aparece en la siguiente fila vacía
3. Verifica los logs del backend para confirmar que el webhook responde correctamente

