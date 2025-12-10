# Mapeo Completo de Columnas del Google Sheet

## Columnas Básicas (A-M)

| Columna | Letra | Nombre | Campo del Backend | Valor |
|---------|-------|--------|-------------------|-------|
| 1 | A | Sucursal | `sucursal` | Vacío por defecto |
| 2 | B | Tipo | (vacío) | Se deja vacío |
| 3 | C | Canal | `canal` | Siempre "abcars.mx" |
| 4 | D | Campaña o submedio | `formType` | financing, testDrive, offer, valuation |
| 5 | E | ID Lead fabricante | (vacío) | Vacío por defecto |
| 6 | F | ID de la oportunidad | (vacío) | Vacío por defecto |
| 7 | G | ID CRM | (vacío) | Vacío por defecto |
| 8 | H | Prefijo | (vacío) | Vacío por defecto |
| 9 | I | Nombre(s) | `nombre` | |
| 10 | J | Apellidos | `apellido` | |
| 11 | K | Teléfono | `telefono` | |
| 12 | L | Teléfono 2 | (vacío) | Vacío por defecto |
| 13 | M | Correo | `correo` | |

## Columnas Adicionales Relevantes

| Columna | Letra | Nombre | Campo del Backend | Notas |
|---------|-------|--------|-------------------|-------|
| 14 | N | Auto de interés | `modelo` o `marca modelo` | Puede contener el modelo del vehículo |
| 22 | V | Comentario del lead | `comentarios` | Comentarios generales |
| 24 | X | Fecha de entrada | `fecha` | Fecha del formulario |
| 57 | BE | Enganche | `enganche` | Solo para financiamiento |
| 68 | BP | Marca | `marca` | |
| 69 | BQ | Modelo | `modelo` | |
| 70 | BR | Año | `año` | |
| 71 | BS | Kilometraje | `kilometraje` | Solo para valuación |
| 72 | BT | Precio de venta | `precio_vehiculo` o `monto_ofrecido` | Depende del formulario |

## Campos por Tipo de Formulario

### Financiamiento (formType: "financing")
- A: Sucursal (vacío)
- B: Tipo (vacío)
- C: Canal ("abcars.mx")
- D: Campaña ("financing")
- I: Nombre
- J: Apellidos
- K: Teléfono
- M: Correo
- N: Auto de interés (marca + modelo)
- V: Comentarios (comentarios concatenados)
- X: Fecha de entrada (fecha)
- BE: Enganche
- BP: Marca
- BQ: Modelo
- BR: Año
- BT: Precio de venta (precio_vehiculo)

### Prueba de Manejo (formType: "testDrive")
- A: Sucursal (vacío)
- B: Tipo (vacío)
- C: Canal ("abcars.mx")
- D: Campaña ("testDrive")
- I: Nombre
- K: Teléfono
- M: Correo
- N: Auto de interés (marca + modelo)
- V: Comentarios
- X: Fecha de entrada (fecha)
- BP: Marca
- BQ: Modelo
- BR: Año

### Oferta (formType: "offer")
- A: Sucursal (vacío)
- B: Tipo (vacío)
- C: Canal ("abcars.mx")
- D: Campaña ("offer")
- I: Nombre
- K: Teléfono
- M: Correo
- N: Auto de interés (marca + modelo)
- V: Comentarios
- X: Fecha de entrada (fecha)
- BT: Precio de venta (monto_ofrecido)
- BP: Marca
- BQ: Modelo
- BR: Año

### Valuación (formType: "valuation")
- A: Sucursal (vacío)
- B: Tipo (vacío)
- C: Canal ("abcars.mx")
- D: Campaña ("valuation")
- I: Nombre
- J: Apellidos
- K: Teléfono
- M: Correo
- N: Auto de interés (marca + modelo)
- V: Comentarios
- X: Fecha de entrada (fecha)
- BP: Marca
- BQ: Modelo
- BR: Año
- BS: Kilometraje

