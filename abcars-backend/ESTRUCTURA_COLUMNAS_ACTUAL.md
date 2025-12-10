# Estructura de Columnas Actual del Google Sheet

## Mapeo Actual (basado en el código)

| Columna | Letra | Nombre Actual | Campo Mapeado | Notas |
|---------|-------|---------------|---------------|-------|
| 1 | A | Sucursal | `sucursal` | Vacío por defecto |
| 2 | B | Tipo | (vacío) | Se deja vacío |
| 3 | C | Canal | `canal` | Siempre "abcars.mx" |
| 4 | D | Campaña o submedio | `formType` | financing, testDrive, offer, valuation |
| 5 | E | ID L | (vacío) | Vacío por defecto |
| 6 | F | ID d | (vacío) | Vacío por defecto |
| 7 | G | ID CRM | (vacío) | Vacío por defecto |
| 8 | H | Prefijo | (vacío) | Vacío por defecto |
| 9 | I | Nombre(s) | `nombre` | |
| 10 | J | Apellidos | `apellido` | |
| 11 | K | Teléfono | `telefono` | |
| 12 | L | Teléfono 2 | (vacío) | Vacío por defecto |
| 13 | M | Correo | `correo` | |
| 14 | N | Modelo | `modelo` | Si aplica |
| 15 | O | Modelo Body | `modelo_body` | Si aplica |
| 16 | P | Marca | `marca` | Si aplica |
| 17 | Q | Año | `año` | Si aplica |
| 18 | R | Fecha del formulario | `fecha` | Si aplica |
| 19 | S | Precio vehículo | `precio_vehiculo` | Si aplica |
| 20 | T | Precio ofrecido | `monto_ofrecido` | Si aplica |
| 21 | U | Enganche | `enganche` | Si aplica |
| 22 | V | Mensualidad | `mensualidad` | Si aplica |
| 23 | W | Comentarios | `comentarios` | Si aplica |
| 24 | X | Fecha preferida | `fecha_preferida` | Si aplica |
| 25 | Y | Hora preferida | `hora_preferida` | Si aplica |
| 26 | Z | Kilometraje | `kilometraje` | Si aplica |

## Campos Disponibles desde el Backend

### Formulario de Financiamiento
- `sucursal` (vacío)
- `formType` = "financing"
- `canal` = "abcars.mx"
- `nombre`
- `apellido`
- `telefono`
- `correo`
- `marca`
- `modelo`
- `año`
- `precio_vehiculo`
- `enganche`
- `mensualidad`
- `plazo_meses`
- `fecha`
- `comentarios` (concatenado con información adicional)

### Formulario de Prueba de Manejo
- `sucursal` (vacío)
- `formType` = "testDrive"
- `canal` = "abcars.mx"
- `nombre`
- `telefono`
- `correo`
- `fecha_preferida`
- `hora_preferida`
- `marca`
- `modelo`
- `año`
- `comentarios`

### Formulario de Oferta
- `sucursal` (vacío)
- `formType` = "offer"
- `canal` = "abcars.mx"
- `nombre`
- `telefono`
- `correo`
- `monto_ofrecido`
- `marca`
- `modelo`
- `año`
- `comentarios`

### Formulario de Valuación
- `sucursal` (vacío)
- `formType` = "valuation"
- `canal` = "abcars.mx"
- `nombre`
- `apellido`
- `telefono`
- `correo`
- `marca`
- `modelo`
- `año`
- `kilometraje`
- `comentarios`

## Nota

**Este mapeo es una aproximación basada en el código actual.** Para mapear correctamente, necesitamos la lista completa y exacta de todas las columnas del Google Sheet desde la fila 1 (header).

