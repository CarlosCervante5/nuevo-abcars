# Documento de Requisitos — Completar Módulo de Referidos del Vendedor

## Introducción

Este documento define los requisitos para completar el módulo de enlaces de referidos para vendedores en la aplicación ABCars. La infraestructura base ya existe (generación de links, captura de parámetro `?ref=`, almacenamiento en `sessionStorage`, tracking de `referrer_user_id` en `customer_appointments`, vista "Mis referidos" y asignación de valuador). Los requisitos aquí descritos cubren las piezas faltantes: estadísticas del dashboard del vendedor, endpoint backend de estadísticas, botón de compartir por WhatsApp, búsqueda funcional en "Mis referidos" y enlaces de referido por vehículo con opción de compartir por WhatsApp.

## Glosario

- **Sistema_Dashboard**: Componente de dashboard del vendedor (`overview.component`) que muestra tarjetas de módulos, link de referido y estadísticas.
- **Sistema_Backend**: API Laravel backend de ABCars, protegida con `auth:sanctum`.
- **Sistema_Referidos**: Vista "Mis referidos" (`appointment-manager.component`) que lista las citas generadas por el link de referido del vendedor.
- **Sistema_Inventario**: Vista de inventario del vendedor (`inventory-view.component`) que muestra los vehículos disponibles.
- **Vendedor**: Usuario con rol `seller` autenticado en el panel de administración.
- **Referido**: Cita (`customer_appointment`) que tiene el campo `referrer_user_id` apuntando al vendedor que compartió el link.
- **Referido_Convertido**: Referido cuya cita tiene una valuación asociada (`vehicle_valuation`) con estado completado o que derivó en una venta.
- **ReferralService**: Servicio Angular existente que construye URLs de referido y gestiona el UUID del referrer.
- **WhatsApp_API**: API de WhatsApp Web (`https://wa.me/`) que permite abrir una conversación con mensaje pre-llenado.

## Requisitos

### Requisito 1: Endpoint de estadísticas de referidos del vendedor

**Historia de Usuario:** Como vendedor, quiero consultar mis estadísticas de referidos desde el backend, para que el dashboard muestre datos reales en lugar de placeholders.

#### Criterios de Aceptación

1. WHEN el Vendedor realiza una petición GET a `/api/seller/referral-stats`, THE Sistema_Backend SHALL responder con un objeto JSON que contenga los campos `total_referrals`, `month_referrals` y `converted_referrals`.
2. WHILE el Vendedor está autenticado con rol `seller`, THE Sistema_Backend SHALL calcular `total_referrals` como el conteo total de registros en `customer_appointments` donde `referrer_user_id` coincide con el ID del Vendedor autenticado.
3. WHILE el Vendedor está autenticado con rol `seller`, THE Sistema_Backend SHALL calcular `month_referrals` como el conteo de registros en `customer_appointments` donde `referrer_user_id` coincide con el ID del Vendedor y la fecha de creación pertenece al mes y año en curso.
4. WHILE el Vendedor está autenticado con rol `seller`, THE Sistema_Backend SHALL calcular `converted_referrals` como el conteo de registros en `customer_appointments` donde `referrer_user_id` coincide con el ID del Vendedor y existe una `vehicle_valuation` asociada con estado completado.
5. IF un usuario no autenticado o sin rol `seller` realiza la petición, THEN THE Sistema_Backend SHALL responder con código HTTP 401 o 403 y un mensaje de error descriptivo.
6. IF ocurre un error interno al calcular las estadísticas, THEN THE Sistema_Backend SHALL responder con código HTTP 500 y un mensaje de error genérico sin exponer detalles internos.

### Requisito 2: Estadísticas de referidos en el dashboard del vendedor

**Historia de Usuario:** Como vendedor, quiero ver mis estadísticas de referidos en el dashboard, para que pueda monitorear mi desempeño sin depender de placeholders.

#### Criterios de Aceptación

1. WHEN el Sistema_Dashboard se carga para un usuario con rol `seller`, THE Sistema_Dashboard SHALL realizar una petición al endpoint `/api/seller/referral-stats` y mostrar los valores recibidos.
2. THE Sistema_Dashboard SHALL mostrar el valor de `month_referrals` en la tarjeta etiquetada "REFERIDOS MES" reemplazando el placeholder "—".
3. THE Sistema_Dashboard SHALL mostrar el valor de `total_referrals` en la tarjeta etiquetada "REFERIDOS TOTAL" reemplazando el placeholder "—".
4. THE Sistema_Dashboard SHALL mostrar el valor de `converted_referrals` en la tarjeta etiquetada "CONVERTIDOS" reemplazando el placeholder "—".
5. WHILE la petición al endpoint está en curso, THE Sistema_Dashboard SHALL mostrar un indicador de carga en las tarjetas de estadísticas.
6. IF la petición al endpoint falla, THEN THE Sistema_Dashboard SHALL mostrar "0" como valor por defecto en cada tarjeta de estadísticas.

### Requisito 3: Botón de compartir por WhatsApp en el dashboard del vendedor

**Historia de Usuario:** Como vendedor, quiero compartir mi link de referido por WhatsApp directamente desde el dashboard, para que pueda enviar el enlace a clientes potenciales de forma rápida.

#### Criterios de Aceptación

1. WHEN el Sistema_Dashboard muestra el link de referido del Vendedor, THE Sistema_Dashboard SHALL mostrar un botón de WhatsApp junto al botón "Copiar" existente.
2. WHEN el Vendedor hace clic en el botón de WhatsApp, THE Sistema_Dashboard SHALL abrir una nueva pestaña con la URL de WhatsApp_API (`https://wa.me/?text=`) incluyendo un mensaje pre-llenado con el link de referido del Vendedor.
3. THE Sistema_Dashboard SHALL incluir en el mensaje pre-llenado un texto introductorio en español seguido del link de referido completo.
4. THE Sistema_Dashboard SHALL codificar correctamente el mensaje para la URL de WhatsApp_API usando `encodeURIComponent`.

### Requisito 4: Búsqueda funcional en la vista "Mis referidos"

**Historia de Usuario:** Como vendedor, quiero filtrar mis referidos por nombre, teléfono, marca o modelo, para que pueda encontrar rápidamente un referido específico.

#### Criterios de Aceptación

1. WHEN el Vendedor escribe texto en el campo de búsqueda de la vista "Mis referidos", THE Sistema_Referidos SHALL enviar el término de búsqueda como parámetro `keyword` al endpoint de búsqueda de citas.
2. WHEN el Vendedor escribe texto en el campo de búsqueda, THE Sistema_Referidos SHALL filtrar los resultados por coincidencia parcial en los campos: nombre del cliente, apellido del cliente, teléfono, marca del vehículo y modelo del vehículo.
3. WHEN el campo de búsqueda está vacío, THE Sistema_Referidos SHALL mostrar todos los referidos del Vendedor sin filtro de palabra clave.
4. THE Sistema_Referidos SHALL vincular el campo de búsqueda HTML existente al componente mediante `ngModel` y ejecutar la búsqueda al presionar Enter o tras un debounce de 400ms.
5. IF la búsqueda no produce resultados, THEN THE Sistema_Referidos SHALL mostrar el mensaje existente "No hay datos que coincidan con el filtro" en la tabla.

### Requisito 5: Compartir link de referido por vehículo con WhatsApp en inventario

**Historia de Usuario:** Como vendedor, quiero compartir por WhatsApp el link de referido de un vehículo específico desde la vista de inventario, para que pueda enviar a un cliente potencial un enlace directo al vehículo que le interesa.

#### Criterios de Aceptación

1. WHEN el Vendedor visualiza la tabla de inventario, THE Sistema_Inventario SHALL mostrar un botón de WhatsApp junto al botón "Compartir" existente en la columna de acciones de cada vehículo.
2. WHEN el Vendedor hace clic en el botón de WhatsApp de un vehículo, THE Sistema_Inventario SHALL abrir una nueva pestaña con la URL de WhatsApp_API incluyendo un mensaje pre-llenado con el nombre del vehículo y el link de referido específico para ese vehículo.
3. THE Sistema_Inventario SHALL construir el link de referido por vehículo usando el método `buildVehicleReferralUrl` del ReferralService existente.
4. THE Sistema_Inventario SHALL codificar correctamente el mensaje para la URL de WhatsApp_API usando `encodeURIComponent`.
5. IF el UUID del Vendedor no está disponible en localStorage, THEN THE Sistema_Inventario SHALL mostrar un mensaje de error indicando que no se pudo obtener el identificador del vendedor.

### Requisito 6: Búsqueda backend con filtro por marca y modelo

**Historia de Usuario:** Como vendedor, quiero que la búsqueda en "Mis referidos" también filtre por marca y modelo del vehículo, para que pueda encontrar referidos por el vehículo que trajeron a valuar.

#### Criterios de Aceptación

1. WHEN el Sistema_Backend recibe una petición de búsqueda de citas con el parámetro `keyword`, THE Sistema_Backend SHALL aplicar el filtro de coincidencia parcial también sobre los campos `brand_name` y `model_name` de la tabla de vehículos del cliente.
2. WHILE el usuario tiene rol `seller`, THE Sistema_Backend SHALL mantener el filtro de `referrer_user_id` del Vendedor al aplicar la búsqueda por keyword, asegurando que solo se devuelvan referidos propios.
3. IF el parámetro `keyword` está vacío o no se envía, THEN THE Sistema_Backend SHALL devolver todos los referidos del Vendedor sin filtro adicional.
