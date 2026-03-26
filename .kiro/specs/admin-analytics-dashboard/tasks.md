# Plan de Implementación: Dashboard de Analytics para Admin

## Resumen

Implementar un dashboard de analytics de negocio en el panel de administración de ABCars. El backend (Laravel/PHP) proveerá endpoints de datos agregados y el frontend (Angular 19) renderizará gráficas y tablas usando Angular Material, Tailwind CSS y ng2-charts (Chart.js). Se sigue la arquitectura definida en el diseño: controlador separado `AdminAnalyticsDashboardController`, servicio Angular `AdminAnalyticsDashboardService`, y componentes standalone con lazy loading.

## Tareas

- [x] 1. Crear el controlador backend y rutas de API
  - [x] 1.1 Crear `AdminAnalyticsDashboardController` con validación de filtros comunes
    - Crear archivo `abcars-backend/app/Http/Controllers/Analytics/AdminAnalyticsDashboardController.php`
    - Implementar método privado para validar y extraer `start_date`, `end_date`, `dealership_id` (defaults: 30 días, hoy, null)
    - Implementar validación de rango máximo de 90 días
    - Implementar método `dealerships()` que retorne la lista de sucursales activas
    - Implementar manejo de errores con try-catch y formato JSON estándar `{ "error": true, "message": "..." }`
    - _Requerimientos: 2.4, 9.7, 9.8_

  - [x] 1.2 Implementar endpoint `topSold` — vehículos más vendidos
    - Query: vehículos con status `sold`, agrupados por marca + línea, ordenados por cantidad DESC, LIMIT 10
    - Filtrar por `start_date`, `end_date`, `dealership_id`
    - Retornar estructura `{ data: TopSoldItem[], filters: {...} }`
    - _Requerimientos: 3.1, 9.1_

  - [x] 1.3 Implementar endpoint `recentSold` — ventas recientes
    - Query: vehículos con status `sold`, ordenados por `updated_at` DESC, LIMIT 20
    - Incluir joins a `vehicle_brands` y `dealerships`
    - _Requerimientos: 4.1, 9.2_

  - [x] 1.4 Implementar endpoint `mostRequested` — vehículos más solicitados
    - Combinar conteos de `AskInformation` (por `vehicles_uuid`) y `CustomerAppointment` (por `vehicle_id`)
    - Usar subquery union agrupada por vehículo, ordenada por total combinado DESC, LIMIT 10
    - _Requerimientos: 5.1, 9.3_

  - [x] 1.5 Implementar endpoint `mostValuated` — vehículos más valuados
    - Query: `vehicle_valuations` agrupadas por marca + línea, con COUNT y AVG(`final_offer`)
    - Ordenar por cantidad de valuaciones DESC, LIMIT 10
    - _Requerimientos: 6.1, 6.3, 9.4_

  - [x] 1.6 Implementar endpoint `longestInventory` — antigüedad en inventario
    - Query: vehículos con status != `sold`, calcular días con `DATEDIFF(CURDATE(), COALESCE(purchase_date, created_at))`
    - Ordenar por días DESC, LIMIT 15
    - _Requerimientos: 7.1, 9.5_

  - [x] 1.7 Implementar endpoint `priceHistory` — historial de precios
    - Parsear `replaced_json` y `request_json` de `VehicleUpdate` para detectar cambios en `sale_price`, `list_price`, `offer_price`
    - Agrupar por día o semana según rango del periodo
    - Soportar filtro opcional por `vehicle_id` para historial individual
    - _Requerimientos: 8.1, 8.3, 9.6_

  - [x] 1.8 Registrar rutas en `routes/api.php`
    - Agregar grupo de rutas `admin/analytics` con middleware `auth:sanctum` y `role:administrator|super_admin`
    - Registrar los 7 endpoints: `top-sold`, `recent-sold`, `most-requested`, `most-valuated`, `longest-inventory`, `price-history`, `dealerships`
    - _Requerimientos: 9.1–9.6, 9.8_


  - [ ]* 1.9 Escribir test de propiedad: Propagación de filtros (Propiedad 1)
    - **Propiedad 1: Propagación de filtros a todos los endpoints**
    - Generar combinaciones aleatorias de `start_date`, `end_date`, `dealership_id` (100+ iteraciones)
    - Verificar que todos los endpoints aceptan los parámetros y retornan solo datos dentro del rango
    - **Valida: Requerimientos 2.3, 2.4**

  - [ ]* 1.10 Escribir test de propiedad: Top vendidos (Propiedad 2)
    - **Propiedad 2: Top vendidos — ordenamiento y límite**
    - Generar conjuntos aleatorios de vehículos con distintos status y fechas
    - Verificar que retorna máximo 10 elementos, solo status `sold`, agrupados por marca+línea, ordenados DESC
    - **Valida: Requerimientos 3.1**

  - [ ]* 1.11 Escribir test de propiedad: Ventas recientes (Propiedad 3)
    - **Propiedad 3: Ventas recientes — ordenamiento y límite**
    - Generar conjuntos aleatorios de vehículos vendidos
    - Verificar máximo 20 resultados, ordenados por fecha DESC, todos dentro del rango
    - **Valida: Requerimientos 4.1**

  - [ ]* 1.12 Escribir test de propiedad: Más solicitados (Propiedad 4)
    - **Propiedad 4: Vehículos más solicitados — conteo combinado**
    - Generar conjuntos aleatorios de AskInformation y CustomerAppointment
    - Verificar máximo 10 resultados, conteo total = suma de ambas tablas
    - **Valida: Requerimientos 5.1**

  - [ ]* 1.13 Escribir test de propiedad: Más valuados (Propiedad 5)
    - **Propiedad 5: Vehículos más valuados — conteo y promedio correcto**
    - Generar conjuntos aleatorios de valuaciones
    - Verificar máximo 10 grupos, ordenados por cantidad DESC, avg_final_offer correcto
    - **Valida: Requerimientos 6.1, 6.3**

  - [ ]* 1.14 Escribir test de propiedad: Antigüedad en inventario (Propiedad 6)
    - **Propiedad 6: Antigüedad en inventario — cálculo de días y ordenamiento**
    - Generar vehículos con distintas fechas y purchase_date nulo
    - Verificar máximo 15 resultados, cálculo de días correcto, ordenados DESC
    - **Valida: Requerimientos 7.1**

  - [ ]* 1.15 Escribir test de propiedad: Historial de precios (Propiedad 8)
    - **Propiedad 8: Historial de precios — solo cambios de precio**
    - Generar registros de VehicleUpdate con y sin cambios de precio
    - Verificar que solo se retornan registros con modificaciones en sale_price, list_price u offer_price
    - **Valida: Requerimientos 8.1**

  - [ ]* 1.16 Escribir test de propiedad: Protección por rol (Propiedad 9)
    - **Propiedad 9: Protección de endpoints por autenticación y rol**
    - Intentar acceso con usuarios de distintos roles (customer, seller, etc.)
    - Verificar que todos los endpoints retornan 401 o 403 para usuarios sin rol adecuado
    - **Valida: Requerimientos 9.8**

  - [ ]* 1.17 Escribir test de propiedad: Formato de error (Propiedad 10)
    - **Propiedad 10: Formato de error consistente**
    - Provocar errores en endpoints con parámetros inválidos
    - Verificar que la respuesta contiene `error` (boolean) y `message` (string)
    - **Valida: Requerimientos 9.7**

- [x] 2. Checkpoint — Verificar backend
  - Asegurar que todos los tests pasan, preguntar al usuario si surgen dudas.

- [x] 3. Crear servicio Angular y componente principal del dashboard
  - [x] 3.1 Instalar dependencia `ng2-charts` y `chart.js`
    - Ejecutar `npm install ng2-charts chart.js` en `abcars-frontend/`
    - _Requerimientos: 3.2, 5.2, 6.2, 8.2_

  - [x] 3.2 Crear `AdminAnalyticsDashboardService`
    - Crear archivo `abcars-frontend/src/app/shared/services/admin-analytics-dashboard.service.ts`
    - Definir interfaces: `DashboardFilters`, `TopSoldItem`, `RecentSoldItem`, `MostRequestedItem`, `MostValuatedItem`, `LongestInventoryItem`, `PriceHistoryPoint`, `VehiclePriceHistory`
    - Implementar métodos HTTP GET para cada endpoint con `HttpClient`
    - Manejar errores con `catchError` de RxJS
    - _Requerimientos: 2.4, 9.1–9.6_

  - [x] 3.3 Crear `AnalyticsDashboardComponent` (componente contenedor principal)
    - Crear como componente standalone en `abcars-frontend/src/app/admin/administrador/pages/analytics-dashboard/`
    - Gestionar estado de filtros (periodo por defecto: 30 días, sucursal: todas)
    - Orquestar la carga de datos para cada sub-componente
    - Layout responsivo con grid de Tailwind CSS (escritorio 1024px+, tablet 768px+)
    - _Requerimientos: 1.1, 2.1, 2.2, 10.3_

  - [x] 3.4 Crear `DashboardFilterComponent`
    - Componente standalone con `mat-select` para periodo predefinido (7, 30, 60, 90 días) y `mat-date-range-input` para rango personalizado
    - `mat-select` para filtro de sucursal con opción "Todas las sucursales"
    - Emitir evento `filtersChange` con `DashboardFilters` al cambiar cualquier filtro
    - Cargar lista de sucursales desde endpoint `dealerships`
    - _Requerimientos: 2.1, 2.2, 2.3_


- [x] 4. Implementar sub-componentes de gráficas y tablas
  - [x] 4.1 Crear `TopSoldChartComponent` — gráfica de barras horizontales
    - Componente standalone que recibe `TopSoldItem[]` vía `@Input()`
    - Renderizar gráfica de barras horizontales con ng2-charts (Chart.js)
    - Mostrar indicador de carga (skeleton/spinner) mientras se cargan datos
    - Mostrar mensaje "Sin datos para el periodo seleccionado" cuando el array esté vacío
    - _Requerimientos: 3.2, 3.3, 10.2_

  - [x] 4.2 Crear `RecentSoldTableComponent` — tabla de ventas recientes
    - Componente standalone que recibe `RecentSoldItem[]` vía `@Input()`
    - Renderizar `mat-table` con columnas: nombre del vehículo, marca, precio de venta, sucursal, fecha de venta
    - Mostrar mensaje "Sin ventas recientes en el periodo seleccionado" cuando esté vacío
    - _Requerimientos: 4.2, 4.3, 10.2_

  - [x] 4.3 Crear `MostRequestedChartComponent` — gráfica de barras verticales
    - Componente standalone que recibe `MostRequestedItem[]` vía `@Input()`
    - Renderizar gráfica de barras verticales mostrando total de solicitudes (leads + citas)
    - Mostrar mensaje vacío cuando no hay datos
    - _Requerimientos: 5.2, 5.3, 10.2_

  - [x] 4.4 Crear `MostValuatedChartComponent` — gráfica de barras con promedio
    - Componente standalone que recibe `MostValuatedItem[]` vía `@Input()`
    - Renderizar gráfica de barras con etiqueta de promedio de `final_offer`
    - Mostrar mensaje vacío cuando no hay datos
    - _Requerimientos: 6.2, 6.3, 6.4, 10.2_

  - [x] 4.5 Crear `LongestInventoryTableComponent` — tabla con resaltado condicional
    - Componente standalone que recibe `LongestInventoryItem[]` vía `@Input()`
    - Renderizar `mat-table` con columnas: nombre, marca, días en inventario, precio de lista, sucursal
    - Aplicar clase CSS de advertencia (color rojo/naranja) a filas con más de 90 días
    - Mostrar mensaje vacío cuando no hay datos
    - _Requerimientos: 7.2, 7.3, 7.4, 10.2_

  - [x] 4.6 Crear `PriceHistoryChartComponent` — gráfica de líneas con selector
    - Componente standalone que recibe datos de historial de precios vía `@Input()`
    - Renderizar gráfica de líneas con 3 series: `sale_price`, `list_price`, `offer_price`
    - Incluir `mat-select` para seleccionar un vehículo específico y ver su historial individual
    - Mostrar mensaje vacío cuando no hay datos
    - _Requerimientos: 8.2, 8.3, 8.4, 10.2_

  - [ ]* 4.7 Escribir test de propiedad: Resaltado por antigüedad (Propiedad 7)
    - **Propiedad 7: Resaltado de advertencia por antigüedad**
    - Usar fast-check para generar vehículos con distintos `days_in_inventory`
    - Verificar que vehículos con >90 días tienen la clase CSS de advertencia y los demás no
    - **Valida: Requerimientos 7.3**

  - [ ]* 4.8 Escribir test de propiedad: Aislamiento de errores (Propiedad 11)
    - **Propiedad 11: Aislamiento de errores entre secciones**
    - Usar fast-check para simular errores en endpoints individuales
    - Verificar que solo la sección afectada muestra error, las demás funcionan normalmente
    - **Valida: Requerimientos 10.4**

- [x] 5. Checkpoint — Verificar componentes frontend
  - Asegurar que todos los tests pasan, preguntar al usuario si surgen dudas.

- [ ] 6. Integración y cableado final
  - [x] 6.1 Registrar ruta del dashboard en el módulo de administración
    - Agregar ruta `analytics-dashboard` en `abcars-frontend/src/app/admin/administrador/administrador-routing.module.ts`
    - Configurar lazy loading del componente standalone `AnalyticsDashboardComponent`
    - _Requerimientos: 1.1, 1.2_

  - [x] 6.2 Agregar enlace de navegación al dashboard de admin
    - Agregar enlace/botón "Analytics Dashboard" en la página principal del dashboard del administrador (`DashboardAdminComponent`)
    - _Requerimientos: 1.3_

  - [x] 6.3 Conectar filtros con todos los sub-componentes
    - Cablear el evento `filtersChange` del `DashboardFilterComponent` para recargar datos en todos los sub-componentes
    - Implementar manejo de errores aislado por sección (cada sub-componente maneja su propio estado de loading/error)
    - _Requerimientos: 2.3, 10.2, 10.4_

  - [ ]* 6.4 Escribir tests unitarios de integración del dashboard
    - Verificar que el componente principal renderiza todas las secciones
    - Verificar que los filtros tienen valores por defecto correctos (30 días, todas las sucursales)
    - Verificar que cambiar filtros dispara recarga de datos en todas las secciones
    - _Requerimientos: 1.1, 2.1, 2.3_

- [x] 7. Checkpoint final — Verificar integración completa
  - Asegurar que todos los tests pasan, preguntar al usuario si surgen dudas.

## Notas

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada tarea referencia requerimientos específicos para trazabilidad
- Los checkpoints aseguran validación incremental
- Los tests de propiedad validan propiedades universales de correctitud
- Los tests unitarios validan ejemplos específicos y casos borde
