# Instrucciones para Verificar que el Script de Google Apps está Actualizado

## Problema Identificado

El webhook está respondiendo solo con `{"result":"success"}` sin la información de debug, lo que sugiere que el script de Google Apps Script no tiene los cambios actualizados.

## Pasos para Verificar

### 1. Verificar que el Script está Guardado

1. Abre tu Google Sheet
2. Ve a **Extensiones** > **Apps Script**
3. Verifica que el código en `doPost` tenga:
   - La función `findNextEmptyRow()` (líneas 95-121)
   - Los logs `Logger.log('First empty row found: X')`
   - La respuesta con información de debug (líneas 228-259)

### 2. Guardar y Desplegar el Script

1. Presiona **Ctrl+S** (o **Cmd+S** en Mac) para guardar
2. Si es necesario, ve a **Desplegar** > **Gestionar despliegues**
3. Asegúrate de que la versión desplegada sea la más reciente

### 3. Verificar los Logs de Ejecución

1. En Google Apps Script, ve a **Ejecuciones** (menú izquierdo)
2. Busca la última ejecución (debería tener timestamp reciente)
3. Haz clic en la ejecución para ver los logs
4. Busca estos mensajes:
   - `"Request received"`
   - `"First empty row found: X"` (donde X debería ser 56 o similar)
   - `"Next empty row to use: X"`
   - `"Debug info: {...}"`

### 4. Verificar la Respuesta del Webhook

La respuesta debería incluir información de debug como:
```json
{
  "result": "success",
  "row": 56,
  "debug": {
    "lastRowUsed": 56,
    "getLastRowMethod": 55,
    "sucursal": "",
    "canal": "abcars.mx",
    ...
  }
}
```

Si solo ves `{"result":"success"}`, significa que el script no está actualizado.

### 5. Si el Script NO está Actualizado

1. Copia TODO el código del archivo `GOOGLE_APPS_SCRIPT_CORREGIDO.js`
2. Pégalo completamente en Google Apps Script (reemplazando todo)
3. Guarda (Ctrl+S o Cmd+S)
4. Si tienes un despliegue, actualízalo o crea uno nuevo
5. Prueba nuevamente

### 6. Verificar el Código Clave

Asegúrate de que el código tenga estas líneas específicas:

**Función findNextEmptyRow (debe estar dentro de doPost):**
```javascript
function findNextEmptyRow(sheet) {
  var startRow = 2;
  var maxRowsToCheck = 2000;
  var nombreRange = sheet.getRange(startRow, 9, maxRowsToCheck, 1).getValues();
  var telefonoRange = sheet.getRange(startRow, 11, maxRowsToCheck, 1).getValues();
  var correoRange = sheet.getRange(startRow, 12, maxRowsToCheck, 1).getValues();
  
  for (var i = 0; i < maxRowsToCheck; i++) {
    var nombre = nombreRange[i][0];
    var telefono = telefonoRange[i][0];
    var correo = correoRange[i][0];
    
    if (!nombre && !telefono && !correo) {
      var emptyRow = startRow + i;
      Logger.log('First empty row found: ' + emptyRow);
      return emptyRow;
    }
  }
  ...
}
```

**Respuesta con debug:**
```javascript
return ContentService
  .createTextOutput(JSON.stringify({
    "result": "success",
    "row": lastRow,
    "debug": debugInfo
  }))
  .setMimeType(ContentService.MimeType.JSON);
```

## Próximos Pasos

Una vez que verifiques que el script está actualizado:
1. Envía un lead de prueba desde el backend
2. Revisa los logs de ejecución en Google Apps Script
3. Verifica la respuesta del webhook en los logs del backend
4. Confirma en Google Sheets que el dato se agregó en la fila correcta

