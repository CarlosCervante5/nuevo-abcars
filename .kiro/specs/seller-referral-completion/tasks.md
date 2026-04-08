# Tareas de Implementación — Completar Módulo de Referidos del Vendedor

## Tarea 1: Endpoint backend de estadísticas de referidos
- [x] 1.1 Crear `SellerReferralController` en `app/Http/Controllers/Seller/SellerReferralController.php` con método `stats()` que calcule `total_referrals`, `month_referrals` y `converted_referrals` usando queries sobre `customer_appointments` y `vehicle_valuations`
- [x] 1.2 Agregar validación de rol `seller` en el método `stats()`, retornando 403 si el usuario no tiene el rol
- [x] 1.3 Registrar la ruta `GET /api/seller/referral-stats` con middleware `auth:sanctum` en `routes/api.php`
- [x] 1.4 Agregar manejo de errores con try/catch que retorne HTTP 500 con mensaje genérico usando `ApiResponseHelper`

## Tarea 2: Corregir búsqueda y agregar filtro por marca/modelo en AppointmentController
- [x] 2.1 Corregir el bug de `orWhere` en `AppointmentController::search` reemplazando los `orWhere` por un closure `where(function($q) { ... })` que agrupe las condiciones OR dentro de un AND con el filtro de `referrer_user_id`
- [x] 2.2 Agregar `brand_name` y `model_name` de `customer_vehicles` al filtro de keyword dentro del closure

## Tarea 3: Servicio frontend de estadísticas de referidos
- [x] 3.1 Crear `SellerReferralStatsService` en `app/shared/services/seller-referral-stats.service.ts` con método `getStats()` que llame a `GET /api/seller/referral-stats` con header de autorización

## Tarea 4: Integrar estadísticas en el dashboard del vendedor
- [x] 4.1 Modificar `DashboardComponent` para inyectar `SellerReferralStatsService`, llamar a `getStats()` para sellers, y exponer propiedades `referralStats` y `statsLoading`
- [x] 4.2 Agregar `@Input() referralStats` y `@Input() statsLoading` al `OverviewComponent`
- [ ] 4.3 Actualizar el HTML del `OverviewComponent` para mostrar los valores de estadísticas en las tarjetas del CTA banner ("REFERIDOS MES", "REFERIDOS TOTAL", "CONVERTIDOS") reemplazando los placeholders "—", con indicador de carga y fallback a "0"
- [ ] 4.4 Pasar `referralStats` y `statsLoading` desde `DashboardComponent` al `OverviewComponent` en el template HTML

## Tarea 5: Botón de WhatsApp en el dashboard del vendedor
- [x] 5.1 Agregar método `shareWhatsApp()` al `OverviewComponent` que construya la URL de WhatsApp con `encodeURIComponent` y abra nueva pestaña con `window.open`
- [x] 5.2 Agregar botón de WhatsApp en el HTML del `OverviewComponent` junto al botón "Copiar" del link de referido, con ícono y estilo consistente

## Tarea 6: Búsqueda funcional en "Mis referidos"
- [x] 6.1 Agregar propiedad `searchKeyword` al `AppointmentManagerComponent` y vincular el input de búsqueda existente con `[(ngModel)]`
- [x] 6.2 Implementar lógica de búsqueda con debounce de 400ms usando `Subject` y `debounceTime`, y búsqueda al presionar Enter
- [ ] 6.3 Modificar `AppointmentService.getExternalDates()` para aceptar parámetro `keyword` opcional y enviarlo como parámetro en la petición POST
- [ ] 6.4 Asegurar que `FormsModule` esté importado en el módulo de `appointment-manager` para soporte de `ngModel`

## Tarea 7: Botón de WhatsApp por vehículo en inventario
- [x] 7.1 Agregar método `shareVehicleWhatsApp(vehicle, event)` al `InventoryViewComponent` que construya la URL de WhatsApp con el nombre del vehículo y el link de referido del vehículo, y abra nueva pestaña
- [x] 7.2 Agregar botón de WhatsApp en el HTML de `InventoryViewComponent` en la columna de acciones de cada vehículo, junto al botón "Compartir" existente

## Tarea 8: Tests
- [ ] 8.1 Escribir test de propiedad backend (PHPUnit) para la Propiedad 1: cálculo correcto de estadísticas con datos aleatorios (mínimo 100 iteraciones) `// Feature: seller-referral-completion, Property 1: Cálculo correcto de estadísticas de referidos`
- [ ] 8.2 Escribir test de propiedad backend (PHPUnit) para la Propiedad 4: filtrado de búsqueda por keyword en campos múltiples (mínimo 100 iteraciones) `// Feature: seller-referral-completion, Property 4: Filtrado de búsqueda por keyword en campos múltiples`
- [ ] 8.3 Escribir test de propiedad backend (PHPUnit) para la Propiedad 5: aislamiento de referidos por vendedor (mínimo 100 iteraciones) `// Feature: seller-referral-completion, Property 5: Aislamiento de referidos por vendedor`
- [ ] 8.4 Escribir test de propiedad frontend (fast-check) para la Propiedad 3: construcción de URL de WhatsApp para dashboard `// Feature: seller-referral-completion, Property 3: Construcción de URL de WhatsApp para link de referido del dashboard`
- [ ] 8.5 Escribir test de propiedad frontend (fast-check) para la Propiedad 6: construcción de URL de WhatsApp para vehículo `// Feature: seller-referral-completion, Property 6: Construcción de URL de WhatsApp para vehículo específico`
- [ ] 8.6 Escribir tests unitarios backend: autorización (401/403), keyword vacío, endpoint con datos conocidos
- [ ] 8.7 Escribir tests unitarios frontend: llamada a getStats() en init, fallback a "0" en error, existencia de botón WhatsApp
