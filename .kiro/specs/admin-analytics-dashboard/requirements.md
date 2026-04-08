# Documento de Requerimientos: Dashboard de Analytics para Admin

## Introducción

Este documento define los requerimientos para agregar una vista de analytics al panel de administración de ABCars. El dashboard proporcionará reportes y gráficas sobre el rendimiento del inventario de vehículos, incluyendo: vehículos más vendidos, ventas recientes, vehículos más solicitados, vehículos más valuados, antigüedad en inventario, y oscilaciones de precios. La funcionalidad estará disponible para usuarios con rol `administrator` o `super_admin`.

## Glosario

- **Dashboard_Analytics**: Vista principal del módulo de analytics en el panel de administración que contiene todas las gráficas y reportes.
- **API_Analytics**: Conjunto de endpoints del backend (Laravel) que proveen los datos agregados para las gráficas y reportes.
- **Vehicle**: Modelo que representa un vehículo en inventario, con campos como `status`, `sale_price`, `list_price`, `offer_price`, `purchase_date`, `created_at`, y relaciones a `brand`, `line`, `model`, `dealership`.
- **CustomerAppointment**: Modelo que representa citas/solicitudes de clientes asociadas a vehículos.
- **AskInformation**: Modelo de leads que registra solicitudes de información sobre vehículos específicos (campo `vehicles_uuid`).
- **VehicleValuation**: Modelo que representa valuaciones de vehículos con campos como `final_offer`, `trade_in_final`, `estimated_total`.
- **VehicleUpdate**: Modelo que registra cambios históricos a vehículos, almacenando `replaced_json` y `request_json` para rastrear modificaciones de precios.
- **Filtro_Periodo**: Control de selección de rango de fechas que permite al usuario definir el periodo de análisis (7, 30, 60, 90 días o rango personalizado).
- **Filtro_Sucursal**: Control de selección que permite filtrar los datos por sucursal (Dealership).
- **Chart_Component**: Componente Angular que renderiza una gráfica individual usando Angular Material y Tailwind CSS.

## Requerimientos

### Requerimiento 1: Acceso al Dashboard de Analytics

**User Story:** Como administrador, quiero acceder a una vista de analytics en el panel de administración, para poder visualizar reportes y métricas del negocio.

#### Criterios de Aceptación

1. WHEN un usuario con rol `administrator` o `super_admin` navega a la ruta `/admin/administrator/analytics-dashboard`, THE Dashboard_Analytics SHALL renderizar la vista con todas las secciones de gráficas y reportes.
2. WHEN un usuario sin rol `administrator` o `super_admin` intenta acceder a la ruta `/admin/administrator/analytics-dashboard`, THE Dashboard_Analytics SHALL redirigir al usuario a la página de inicio del admin.
3. THE Dashboard_Analytics SHALL mostrar un enlace de navegación en la página principal del dashboard del administrador.

### Requerimiento 2: Filtros Globales de Periodo y Sucursal

**User Story:** Como administrador, quiero filtrar los datos del dashboard por periodo de tiempo y por sucursal, para poder analizar métricas en contextos específicos.

#### Criterios de Aceptación

1. THE Dashboard_Analytics SHALL mostrar un Filtro_Periodo con opciones predefinidas de 7, 30, 60 y 90 días, y un rango personalizado con selector de fechas.
2. THE Dashboard_Analytics SHALL mostrar un Filtro_Sucursal con la opción "Todas las sucursales" seleccionada por defecto y la lista de sucursales activas.
3. WHEN el usuario cambia el Filtro_Periodo o el Filtro_Sucursal, THE Dashboard_Analytics SHALL actualizar todas las gráficas y reportes con los datos correspondientes al nuevo filtro.
4. THE API_Analytics SHALL aceptar parámetros `start_date`, `end_date` y `dealership_id` en todos los endpoints de datos agregados.

### Requerimiento 3: Reporte de Vehículos Más Vendidos

**User Story:** Como administrador, quiero ver una gráfica de los vehículos más vendidos, para identificar qué modelos tienen mayor demanda de compra.

#### Criterios de Aceptación

1. WHEN el Dashboard_Analytics carga la sección de vehículos más vendidos, THE API_Analytics SHALL retornar los 10 vehículos con status `sold` agrupados por marca y línea, ordenados de mayor a menor cantidad de ventas dentro del periodo seleccionado.
2. THE Dashboard_Analytics SHALL renderizar una gráfica de barras horizontales mostrando el nombre del vehículo (marca + línea) y la cantidad de unidades vendidas.
3. IF no existen vehículos vendidos en el periodo seleccionado, THEN THE Dashboard_Analytics SHALL mostrar un mensaje indicando "Sin datos para el periodo seleccionado".

### Requerimiento 4: Reporte de Vehículos Vendidos Recientemente

**User Story:** Como administrador, quiero ver una lista de los vehículos vendidos recientemente, para tener visibilidad de las ventas más recientes.

#### Criterios de Aceptación

1. WHEN el Dashboard_Analytics carga la sección de ventas recientes, THE API_Analytics SHALL retornar los últimos 20 vehículos con status `sold` ordenados por fecha de actualización de status descendente, dentro del periodo seleccionado.
2. THE Dashboard_Analytics SHALL renderizar una tabla con las columnas: nombre del vehículo, marca, precio de venta, sucursal y fecha de venta.
3. IF no existen vehículos vendidos recientemente en el periodo seleccionado, THEN THE Dashboard_Analytics SHALL mostrar un mensaje indicando "Sin ventas recientes en el periodo seleccionado".

### Requerimiento 5: Reporte de Vehículos Más Solicitados

**User Story:** Como administrador, quiero ver cuáles vehículos reciben más solicitudes de información y citas, para entender el interés del mercado.

#### Criterios de Aceptación

1. WHEN el Dashboard_Analytics carga la sección de vehículos más solicitados, THE API_Analytics SHALL retornar los 10 vehículos con mayor cantidad de registros combinados de AskInformation (por `vehicles_uuid`) y CustomerAppointment (por `vehicle_id`) dentro del periodo seleccionado, agrupados por vehículo.
2. THE Dashboard_Analytics SHALL renderizar una gráfica de barras mostrando el nombre del vehículo y la cantidad total de solicitudes (leads + citas).
3. IF no existen solicitudes en el periodo seleccionado, THEN THE Dashboard_Analytics SHALL mostrar un mensaje indicando "Sin solicitudes en el periodo seleccionado".

### Requerimiento 6: Reporte de Vehículos Más Valuados

**User Story:** Como administrador, quiero ver cuáles vehículos han sido más valuados, para entender qué tipo de vehículos traen los clientes para intercambio.

#### Criterios de Aceptación

1. WHEN el Dashboard_Analytics carga la sección de vehículos más valuados, THE API_Analytics SHALL retornar los 10 vehículos con mayor cantidad de VehicleValuation asociadas dentro del periodo seleccionado, agrupados por marca y línea del vehículo valuado.
2. THE Dashboard_Analytics SHALL renderizar una gráfica de barras mostrando el nombre del vehículo (marca + línea) y la cantidad de valuaciones realizadas.
3. THE Dashboard_Analytics SHALL mostrar junto a cada entrada el promedio de `final_offer` de las valuaciones del grupo.
4. IF no existen valuaciones en el periodo seleccionado, THEN THE Dashboard_Analytics SHALL mostrar un mensaje indicando "Sin valuaciones en el periodo seleccionado".

### Requerimiento 7: Reporte de Vehículos con Más Días en Inventario

**User Story:** Como administrador, quiero ver los vehículos que llevan más tiempo en inventario, para tomar decisiones sobre precios o promociones.

#### Criterios de Aceptación

1. THE API_Analytics SHALL retornar los 15 vehículos con status distinto a `sold` ordenados por la diferencia en días entre la fecha actual y `purchase_date` (o `created_at` si `purchase_date` es nulo), de mayor a menor.
2. THE Dashboard_Analytics SHALL renderizar una tabla con las columnas: nombre del vehículo, marca, días en inventario, precio de lista, sucursal.
3. THE Dashboard_Analytics SHALL resaltar visualmente con color de advertencia los vehículos que superen los 90 días en inventario.
4. IF no existen vehículos activos en inventario, THEN THE Dashboard_Analytics SHALL mostrar un mensaje indicando "Sin vehículos en inventario".

### Requerimiento 8: Reporte de Oscilaciones de Precios e Historial de Variaciones

**User Story:** Como administrador, quiero ver el historial de cambios de precios de los vehículos, para analizar tendencias y variaciones en la estrategia de precios.

#### Criterios de Aceptación

1. WHEN el Dashboard_Analytics carga la sección de oscilaciones de precios, THE API_Analytics SHALL retornar el historial de cambios de precio extraído de los registros de VehicleUpdate donde `replaced_json` o `request_json` contengan modificaciones en los campos `sale_price`, `list_price` u `offer_price`, dentro del periodo seleccionado.
2. THE Dashboard_Analytics SHALL renderizar una gráfica de líneas mostrando la evolución del precio promedio de inventario (agrupado por día o semana según el rango del periodo) con líneas separadas para `sale_price`, `list_price` y `offer_price`.
3. THE Dashboard_Analytics SHALL permitir al usuario seleccionar un vehículo específico del inventario para ver su historial individual de cambios de precio en la gráfica de líneas.
4. IF no existen cambios de precio en el periodo seleccionado, THEN THE Dashboard_Analytics SHALL mostrar un mensaje indicando "Sin cambios de precio en el periodo seleccionado".

### Requerimiento 9: Endpoints de API para Analytics del Dashboard

**User Story:** Como desarrollador del frontend, quiero endpoints de API bien definidos para obtener los datos de cada reporte, para poder consumirlos desde el Dashboard_Analytics.

#### Criterios de Aceptación

1. THE API_Analytics SHALL exponer un endpoint `GET /api/admin/analytics/top-sold` que retorne los datos del reporte de vehículos más vendidos.
2. THE API_Analytics SHALL exponer un endpoint `GET /api/admin/analytics/recent-sold` que retorne los datos del reporte de ventas recientes.
3. THE API_Analytics SHALL exponer un endpoint `GET /api/admin/analytics/most-requested` que retorne los datos del reporte de vehículos más solicitados.
4. THE API_Analytics SHALL exponer un endpoint `GET /api/admin/analytics/most-valuated` que retorne los datos del reporte de vehículos más valuados.
5. THE API_Analytics SHALL exponer un endpoint `GET /api/admin/analytics/longest-inventory` que retorne los datos del reporte de antigüedad en inventario.
6. THE API_Analytics SHALL exponer un endpoint `GET /api/admin/analytics/price-history` que retorne los datos del reporte de oscilaciones de precios.
7. IF ocurre un error al procesar cualquier endpoint, THEN THE API_Analytics SHALL retornar un código HTTP 500 con un mensaje de error descriptivo en formato JSON.
8. THE API_Analytics SHALL proteger todos los endpoints con middleware de autenticación y verificación de rol `administrator` o `super_admin`.

### Requerimiento 10: Rendimiento y Experiencia de Usuario

**User Story:** Como administrador, quiero que el dashboard cargue de forma eficiente y sea fácil de usar, para poder consultar los datos sin demoras.

#### Criterios de Aceptación

1. THE API_Analytics SHALL responder cada endpoint de datos agregados en un tiempo menor a 3 segundos para periodos de hasta 90 días.
2. WHILE los datos de una sección se están cargando, THE Dashboard_Analytics SHALL mostrar un indicador de carga (skeleton o spinner) en la sección correspondiente.
3. THE Dashboard_Analytics SHALL ser responsivo y adaptarse a pantallas de escritorio (1024px o más) y tablet (768px o más).
4. IF un endpoint de la API_Analytics retorna un error, THEN THE Dashboard_Analytics SHALL mostrar un mensaje de error en la sección afectada sin afectar las demás secciones.
