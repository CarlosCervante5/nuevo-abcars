function onEdit(e) {
  // Validar que el evento existe y tiene la estructura esperada
  // onEdit solo debe ejecutarse cuando hay una edición manual, no desde scripts
  if (!e || !e.source || !e.range) {
    // Silenciar este log ya que es normal cuando se ejecuta desde doPost
    return;
  }
  
  try {
    var sheet = e.source.getActiveSheet();
    var range = e.range;
    var sheetName = "2024 Formato";
    
    // Validar que la hoja existe
    if (!sheet) {
      Logger.log('onEdit: No se pudo obtener la hoja activa');
      return;
    }
    
    if (sheet.getName() == sheetName) {
    if (
        range.getColumn() == 9 || 
        range.getColumn() == 28 ||
        range.getColumn() == 35 ||
        range.getColumn() == 43 ||
        range.getColumn() == 45 ||
        range.getColumn() == 76
      ) {
      var targetRow = range.getRow();
      var currentDate = new Date();
      
      if (range.getColumn() == 9 ) {
        var targetCellValue = sheet.getRange(targetRow, 24).getValue();
        if(targetCellValue == "" ){
          sheet.getRange(targetRow, 24).setValue(currentDate);
        }
      }
      
      if (range.getColumn() == 28) {
        var targetCellValue = sheet.getRange(targetRow, 26).getValue();
        if(targetCellValue == "" ){
          sheet.getRange(targetRow, 26).setValue(currentDate);
        }
      }
      
      if (range.getColumn() == 35) {
        var targetCellValue = sheet.getRange(targetRow, 36).getValue();
        if(targetCellValue == "" ){
          sheet.getRange(targetRow, 36).setValue(currentDate);
        }
      }
      
      if (range.getColumn() == 43 && range.getValue() !== 'No') {
        var targetCellValue = sheet.getRange(targetRow, 44).getValue();
        if(targetCellValue == "" ){
          sheet.getRange(targetRow, 44).setValue(currentDate);
        }
      }
      
      if (range.getColumn() == 45 && range.getValue() == 'Reprogramada') {
        var targetCellValue = sheet.getRange(targetRow, 46).getValue();
        if(targetCellValue == "" ){
          sheet.getRange(targetRow, 46).setValue(currentDate);
        }
      }
      
      if (range.getColumn() == 76) {
        var targetCellValue = sheet.getRange(targetRow, 75).getValue();
        if(targetCellValue == "" ){
          sheet.getRange(targetRow, 75).setValue(currentDate);
        }
      }
    }
    }
  } catch (error) {
    Logger.log('Error en onEdit: ' + error.toString());
  }
}

// Función doGet para manejar peticiones GET (acceso directo a la URL o pruebas)
function doGet(e) {
  // Si se solicita información de columnas, retornarla
  if (e.parameter && e.parameter.action === 'getColumns') {
    return getSheetColumns();
  }
  
  return ContentService
    .createTextOutput(JSON.stringify({
      "result": "success",
      "message": "Google Apps Script está funcionando correctamente",
      "method": "GET",
      "instructions": "Este endpoint requiere peticiones POST con form-data para recibir datos de formularios.",
      "getColumns": "Agrega ?action=getColumns a la URL para obtener la lista de columnas"
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Función helper para obtener todas las columnas del header
function getSheetColumns() {
  try {
    var sheet = SpreadsheetApp.openById('14O6pBy565EwJJh3Z-l5qbuTrDyK_aQLtZc1oDEsXreU').getSheetByName('2024 Formato');
    var headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    var columns = [];
    for (var i = 0; i < headerRow.length; i++) {
      var columnLetter = getColumnLetter(i + 1);
      columns.push({
        "index": i + 1,
        "letter": columnLetter,
        "name": headerRow[i] || "(vacío)"
      });
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({
        "result": "success",
        "totalColumns": columns.length,
        "columns": columns
      }, null, 2))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        "result": "error",
        "message": error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Función helper para convertir número de columna a letra (1 = A, 2 = B, etc.)
function getColumnLetter(columnNumber) {
  var result = '';
  while (columnNumber > 0) {
    columnNumber--;
    result = String.fromCharCode(65 + (columnNumber % 26)) + result;
    columnNumber = Math.floor(columnNumber / 26);
  }
  return result;
}

function doPost(e) {
  try {
    // Logger para debug
    Logger.log('=== doPost iniciado ===');
    
    // Validar que el evento existe - CRÍTICO
    if (!e) {
      Logger.log('ERROR: Evento e es undefined. Esto no debería pasar en una petición POST real.');
      return ContentService
        .createTextOutput(JSON.stringify({
          "result": "error",
          "message": "Evento no recibido. Verifica que el script esté desplegado correctamente.",
          "debug": "e is undefined"
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    Logger.log('Event type: ' + typeof e);
    Logger.log('Event keys: ' + Object.keys(e).join(', '));
    
    // Obtener parámetros del formulario
    // Google Apps Script recibe form-data en e.parameter (singular) cuando viene como form-urlencoded
    var params = {};
    
    // Verificar qué propiedades tiene el evento para debug
    Logger.log('Event structure check...');
    Logger.log('e.parameter type: ' + typeof e.parameter);
    Logger.log('e.parameters type: ' + typeof e.parameters);
    Logger.log('e.postData type: ' + typeof e.postData);
    
    // Intentar obtener parámetros de diferentes formas
    if (e.parameter) {
      // Form-data normal (form-urlencoded) - e.parameter es un objeto
      params = e.parameter;
      Logger.log('Using e.parameter - Params count: ' + Object.keys(params).length);
    } else if (e.parameters) {
      // Alternativa: e.parameters (plural)
      params = e.parameters;
      Logger.log('Using e.parameters - Params count: ' + Object.keys(params).length);
    } else if (e.postData && e.postData.contents) {
      // Si viene como texto plano, parsearlo
      Logger.log('Parsing postData.contents...');
      var contents = e.postData.contents;
      var type = e.postData.type || 'application/x-www-form-urlencoded';
      
      if (typeof contents === 'string') {
        if (type.includes('urlencoded')) {
          // Parsear como URL-encoded
          var pairs = contents.split('&');
          for (var i = 0; i < pairs.length; i++) {
            var pair = pairs[i].split('=');
            var key = decodeURIComponent(pair[0] || '');
            var value = decodeURIComponent((pair[1] || '').replace(/\+/g, ' '));
            if (key) {
              params[key] = value;
            }
          }
          Logger.log('Parsed postData - Params count: ' + Object.keys(params).length);
        } else if (type.includes('json')) {
          // Intentar parsear como JSON
          try {
            params = JSON.parse(contents);
            Logger.log('Parsed JSON - Params count: ' + Object.keys(params).length);
          } catch (err) {
            Logger.log('Error parsing JSON: ' + err.toString());
          }
        }
      }
    }
    
    // Si no se obtuvieron parámetros, retornar error
    if (Object.keys(params).length === 0) {
      Logger.log('ERROR: No se recibieron parámetros');
      return ContentService
        .createTextOutput(JSON.stringify({
          "result": "error",
          "message": "No se recibieron parámetros en la petición",
          "debug": {
            "hasParameter": !!e.parameter,
            "hasParameters": !!e.parameters,
            "hasPostData": !!(e.postData && e.postData.contents),
            "eventKeys": Object.keys(e)
          }
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    Logger.log('Parameters received: ' + JSON.stringify(params));
    Logger.log('Number of parameters: ' + Object.keys(params).length);
    
    // Obtener la hoja específica
    var sheet = SpreadsheetApp.openById('14O6pBy565EwJJh3Z-l5qbuTrDyK_aQLtZc1oDEsXreU').getSheetByName('2024 Formato');
    
    // Función mejorada para encontrar la primera fila vacía
    // Busca desde la fila 2 (después del header) hasta encontrar la primera fila vacía
    // Verifica las columnas clave: I (nombre), K (teléfono), L (correo)
    function findNextEmptyRow(sheet) {
      var startRow = 2; // Empezar desde la fila 2 (después del header)
      var maxRowsToCheck = 2000; // Limitar la búsqueda a 2000 filas para eficiencia
      
      // Obtener los valores de las columnas clave de una vez para mejor rendimiento
      var nombreRange = sheet.getRange(startRow, 9, maxRowsToCheck, 1).getValues(); // Columna I
      var telefonoRange = sheet.getRange(startRow, 11, maxRowsToCheck, 1).getValues(); // Columna K
      var correoRange = sheet.getRange(startRow, 13, maxRowsToCheck, 1).getValues(); // Columna M (correo)
      
      // Buscar la primera fila completamente vacía en las columnas clave
      for (var i = 0; i < maxRowsToCheck; i++) {
        var nombre = nombreRange[i][0];
        var telefono = telefonoRange[i][0];
        var correo = correoRange[i][0];
        
        // Si todas las columnas clave están vacías, esta es la primera fila vacía
        if (!nombre && !telefono && !correo) {
          var emptyRow = startRow + i;
          Logger.log('First empty row found: ' + emptyRow);
          return emptyRow;
        }
      }
      
      // Si no se encontró ninguna fila vacía en el rango, retornar la siguiente después del rango
      Logger.log('No empty row found in range, returning: ' + (startRow + maxRowsToCheck));
      return startRow + maxRowsToCheck;
    }
    
    // Encuentra la siguiente fila vacía usando la función personalizada
    var lastRow = findNextEmptyRow(sheet);
    
    Logger.log('Next empty row to use: ' + lastRow);
    
    // Mapeo correcto según las columnas:
    // A=Sucursal, B=Tipo (vacío), C=Canal, D=Campaña o submedio (formType), E=ID L, F=ID d, G=ID CRM, H=Prefijo, I=Nombre, J=Apellidos, K=Teléfono, L=Teléfono 2 (vacío), M=Correo
    
    // Helper function para obtener valor (puede ser array)
    function getParamValue(param) {
      if (Array.isArray(param)) return param[0] || '';
      return param || '';
    }
    
    // IMPORTANTE: Usar la MISMA fila (lastRow) para TODOS los campos
    // Preparar todos los valores primero
    var sucursal = getParamValue(params.sucursal) || '';
    var formType = getParamValue(params.formType) || '';
    var canal = getParamValue(params.canal) || 'abcars.mx';
    var campana = formType; // Campaña o submedio = tipo de formulario (financing, testDrive, offer, valuation)
    var nombre = getParamValue(params.nombre) || '';
    var apellido = getParamValue(params.apellido) || '';
    var telefono = getParamValue(params.telefono) || '';
    var correo = getParamValue(params.correo) || '';
    
    Logger.log('Writing to row: ' + lastRow);
    Logger.log('Data: sucursal=' + sucursal + ', tipo=(vacío), canal=' + canal + ', campana=' + campana + ', nombre=' + nombre);
    
    // Escribir TODOS los campos básicos en la MISMA fila usando setValues en un rango
    // Mapeo: A=Sucursal, B=Tipo (vacío), C=Canal, D=Campaña (formType), E=ID L, F=ID d, G=ID CRM, H=Prefijo, I=Nombre, J=Apellidos, K=Teléfono, L=Teléfono 2 (vacío), M=Correo
    var basicData = [
      [sucursal, '', canal, campana, '', '', '', '', nombre, apellido, telefono, '', correo]
    ];
    sheet.getRange(lastRow, 1, 1, 13).setValues(basicData);
    
    // Ahora escribir los campos adicionales en la misma fila según el mapeo correcto del Google Sheet
    
    // Preparar valores adicionales
    var marca = getParamValue(params.marca);
    var modelo = getParamValue(params.modelo);
    var año = getParamValue(params.año);
    var fecha = getParamValue(params.fecha);
    var comentarios = getParamValue(params.comentarios) || getParamValue(params.comentario);
    var precioVehiculo = getParamValue(params.precio_vehiculo);
    var montoOfrecido = getParamValue(params.monto_ofrecido) || getParamValue(params.clientPriceOffer);
    var enganche = getParamValue(params.enganche);
    var kilometraje = getParamValue(params.kilometraje);
    
    // Columna N (14): Auto de interés (marca + modelo)
    var autoInteres = '';
    if (marca && modelo) {
      autoInteres = marca + ' ' + modelo;
    } else if (marca) {
      autoInteres = marca;
    } else if (modelo) {
      autoInteres = modelo;
    }
    if (autoInteres) {
      sheet.getRange(lastRow, 14).setValue(autoInteres);
    }
    
    // Columna V (22): Comentario del lead
    if (comentarios) {
      sheet.getRange(lastRow, 22).setValue(comentarios);
    }
    
    // Columna X (24): Fecha de entrada
    if (fecha) {
      sheet.getRange(lastRow, 24).setValue(fecha);
    }
    
    // Columna BE (57): Enganche (solo para financiamiento)
    if (enganche && formType === 'financing') {
      sheet.getRange(lastRow, 57).setValue(enganche);
    }
    
    // Columna BP (68): Marca
    if (marca) {
      sheet.getRange(lastRow, 68).setValue(marca);
    }
    
    // Columna BQ (69): Modelo
    if (modelo) {
      sheet.getRange(lastRow, 69).setValue(modelo);
    }
    
    // Columna BR (70): Año
    if (año) {
      sheet.getRange(lastRow, 70).setValue(año);
    }
    
    // Columna BS (71): Kilometraje (solo para valuación)
    if (kilometraje && formType === 'valuation') {
      sheet.getRange(lastRow, 71).setValue(kilometraje);
    }
    
    // Columna BT (72): Precio de venta
    // Para financiamiento: precio_vehiculo
    // Para oferta: monto_ofrecido
    if (formType === 'financing' && precioVehiculo) {
      sheet.getRange(lastRow, 72).setValue(precioVehiculo);
    } else if (formType === 'offer' && montoOfrecido) {
      sheet.getRange(lastRow, 72).setValue(montoOfrecido);
    } else if (precioVehiculo) {
      sheet.getRange(lastRow, 72).setValue(precioVehiculo);
    }
    
    Logger.log('All data written to row: ' + lastRow);
    
    // Obtener información de debug
    var getLastRowResult = sheet.getLastRow();
    var maxRows = sheet.getMaxRows();
    
    // Verificar algunas celdas alrededor de lastRow para debug
    var debugInfo = {
      "lastRowUsed": lastRow,
      "getLastRowMethod": getLastRowResult,
      "getLastRowPlusOne": getLastRowResult + 1,
      "maxRows": maxRows,
      "sucursal": getParamValue(params.sucursal) || 'NO RECIBIDO',
      "canal": getParamValue(params.canal) || 'NO RECIBIDO',
      "formType": getParamValue(params.formType) || 'NO RECIBIDO',
      "nombre": getParamValue(params.nombre) || 'NO RECIBIDO',
      "telefono": getParamValue(params.telefono) || 'NO RECIBIDO',
      "correo": getParamValue(params.correo) || 'NO RECIBIDO'
    };
    
    // Verificar el valor de algunas filas antes de escribir (para debug)
    if (lastRow > 2) {
      var prevRowNombre = sheet.getRange(lastRow - 1, 9).getValue();
      var prevRowTelefono = sheet.getRange(lastRow - 1, 11).getValue();
      var prevRowCorreo = sheet.getRange(lastRow - 1, 13).getValue(); // Columna M
      debugInfo["previousRowData"] = {
        "row": lastRow - 1,
        "nombre": prevRowNombre,
        "telefono": prevRowTelefono,
        "correo": prevRowCorreo
      };
    }
    
    Logger.log('Debug info: ' + JSON.stringify(debugInfo));
    Logger.log('=== doPost completado exitosamente ===');
    
    // Verificar que los datos se escribieron correctamente
    var verifySucursal = sheet.getRange(lastRow, 1).getValue();
    var verifyTipo = sheet.getRange(lastRow, 2).getValue();
    var verifyCanal = sheet.getRange(lastRow, 3).getValue();
    var verifyCampana = sheet.getRange(lastRow, 4).getValue();
    var verifyNombre = sheet.getRange(lastRow, 9).getValue();
    var verifyTelefono = sheet.getRange(lastRow, 11).getValue();
    var verifyCorreo = sheet.getRange(lastRow, 13).getValue();
    var verifyAutoInteres = sheet.getRange(lastRow, 14).getValue();
    var verifyComentarios = sheet.getRange(lastRow, 22).getValue();
    var verifyFecha = sheet.getRange(lastRow, 24).getValue();
    var verifyMarca = sheet.getRange(lastRow, 68).getValue();
    var verifyModelo = sheet.getRange(lastRow, 69).getValue();
    var verifyAño = sheet.getRange(lastRow, 70).getValue();
    var verifyPrecio = sheet.getRange(lastRow, 72).getValue();
    Logger.log('Verificación escrita - Row ' + lastRow + ': sucursal=' + verifySucursal + ', tipo=' + verifyTipo + ', canal=' + verifyCanal + ', campana=' + verifyCampana + ', nombre=' + verifyNombre + ', telefono=' + verifyTelefono + ', correo=' + verifyCorreo + ', autoInteres=' + verifyAutoInteres + ', marca=' + verifyMarca + ', modelo=' + verifyModelo + ', año=' + verifyAño);
    
    // Retornar respuesta exitosa con información de debug
    return ContentService
      .createTextOutput(JSON.stringify({
        "result": "success",
        "row": lastRow,
        "debug": debugInfo,
        "written": {
          "sucursal": verifySucursal,
          "tipo": verifyTipo,
          "canal": verifyCanal,
          "campana": verifyCampana,
          "nombre": verifyNombre,
          "telefono": verifyTelefono,
          "correo": verifyCorreo,
          "autoInteres": verifyAutoInteres,
          "comentarios": verifyComentarios,
          "fecha": verifyFecha,
          "marca": verifyMarca,
          "modelo": verifyModelo,
          "año": verifyAño,
          "precio": verifyPrecio
        }
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    // En caso de error, retornar información del error
    Logger.log('Error: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({
        "result": "error",
        "message": error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

