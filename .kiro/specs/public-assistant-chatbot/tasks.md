# Plan de Implementación: Asistente Público (Chatbot)

## Resumen

Implementar un chatbot público basado en OpenAI para ABCars con backend en Laravel (PHP) y frontend en Angular (TypeScript). Se crean controlador, servicio de herramientas, rutas y widget de chat independientes del asistente interno existente. Cada tarea construye sobre las anteriores de forma incremental.

## Tareas

- [x] 1. Crear el servicio PublicAssistantToolsService con las 5 herramientas
  - [x] 1.1 Crear `app/Services/PublicAssistant/PublicAssistantToolsService.php` con el método `execute()` que despacha a las 5 herramientas y el método `getToolsDefinitions()` que retorna las definiciones OpenAI de las herramientas
    - Implementar `searchPublicVehicles`: filtrar Vehicle con `page_status='active'`, parámetros opcionales (`keyword`, `brand`, `type`, `min_price`, `max_price`), máximo 10 resultados, ordenados por `created_at` desc, solo campos públicos (whitelist del diseño)
    - Implementar `getVehicleDetails`: buscar por UUID, solo `page_status='active'`, incluir imágenes y especificaciones, excluir campos prohibidos (`id`, `vin`, `purchase_date`, `sale_price`, etc.)
    - Implementar `createAppointment`: validar nombre (≥2 chars), teléfono (10 dígitos), email (formato válido), fecha futura, sucursal existente en `dealerships`. Buscar o crear Customer por teléfono/email. Crear CustomerAppointment con `type='visit'`, `status='scheduled'`. Retornar UUID, fecha y sucursal
    - Implementar `confirmAppointment`: buscar cita por UUID (no soft-deleted), actualizar status a `confirmed` solo si es `scheduled`, informar estado actual si es diferente
    - Implementar `getAppointmentStatus`: buscar cita por UUID, retornar status, fecha programada, nombre de sucursal y tipo. Omitir `customer_id`, `vehicle_id`, `referrer_user_id`
    - La clase NO debe heredar ni reutilizar métodos de `AssistantToolsService`
    - _Requerimientos: 2.1, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4, 9.1, 9.3_

  - [ ]* 1.2 Escribir test de propiedad: exclusión de campos internos en respuestas
    - **Propiedad 3: Exclusión de campos internos en respuestas**
    - Generar combinaciones aleatorias de llamadas a herramientas y verificar que ninguna respuesta contenga campos prohibidos (`id`, `vin`, `purchase_date`, `sale_price`, `customer_id`, `vehicle_id`, `referrer_user_id`, `deleted_at`) y que todos los vehículos retornados tengan `page_status = 'active'`
    - **Valida: Requerimientos 2.5, 3.1, 3.4, 6.4, 9.3**

  - [ ]* 1.3 Escribir test de propiedad: filtros de búsqueda de vehículos
    - **Propiedad 4: Filtros de búsqueda de vehículos**
    - Generar combinaciones aleatorias de filtros (`keyword`, `brand`, `type`, `min_price`, `max_price`) y verificar que todos los vehículos retornados cumplan con todos los filtros simultáneamente
    - **Valida: Requerimiento 3.2**

  - [ ]* 1.4 Escribir test de propiedad: límite máximo de resultados
    - **Propiedad 5: Límite máximo de resultados de búsqueda**
    - Para cualquier consulta de búsqueda, verificar que el número de resultados sea ≤ 10
    - **Valida: Requerimiento 3.3**

  - [ ]* 1.5 Escribir test de propiedad: validación de datos de cita
    - **Propiedad 6: Validación de datos de cita**
    - Generar datos aleatorios inválidos (nombre <2 chars, teléfono ≠10 dígitos, email inválido, fecha pasada) y verificar que `createAppointment` rechace la solicitud
    - **Valida: Requerimiento 4.2**

  - [ ]* 1.6 Escribir test de propiedad: creación de cita con datos válidos
    - **Propiedad 7: Creación de cita con datos válidos**
    - Generar datos válidos aleatorios y verificar que se cree CustomerAppointment con `type='visit'`, `status='scheduled'` y la respuesta contenga UUID, fecha y sucursal
    - **Valida: Requerimientos 4.4, 4.5**

  - [ ]* 1.7 Escribir test de propiedad: validación de sucursal existente
    - **Propiedad 8: Validación de sucursal existente**
    - Generar nombres de sucursal aleatorios inexistentes y verificar que `createAppointment` rechace la solicitud
    - **Valida: Requerimiento 4.6**

  - [ ]* 1.8 Escribir test de propiedad: confirmación condicional de cita
    - **Propiedad 9: Confirmación condicional de cita**
    - Para citas con distintos estados aleatorios, verificar que `confirmAppointment` solo cambie a `confirmed` si el estado actual es `scheduled`
    - **Valida: Requerimientos 5.3, 5.4**

  - [ ]* 1.9 Escribir test de propiedad: respuesta de estatus de cita
    - **Propiedad 10: Respuesta de estatus de cita**
    - Para cualquier cita existente, verificar que la respuesta de `getAppointmentStatus` contenga exactamente: status, fecha programada, nombre de sucursal y tipo
    - **Valida: Requerimiento 6.3**

- [x] 2. Crear el PublicAssistantController y configurar rutas
  - [x] 2.1 Crear `app/Http/Controllers/PublicAssistant/PublicAssistantController.php`
    - Inyectar `PublicAssistantToolsService` en el constructor
    - Implementar método `query(Request $request)`: validar `message` (required, string, max:500) y `conversation_history` (nullable, array, max:20 elementos con role y content)
    - Verificar que `OPENAI_API_KEY` esté configurada, retornar 503 si no
    - Implementar `callChatGPTWithTools()` siguiendo el patrón del `AssistantController` existente pero con prompt de sistema público que restrinja al ámbito de inventario y citas, y responda siempre en español
    - Registrar en log cada consulta: IP + mensaje (sin datos personales)
    - Manejar errores de OpenAI (401, 429, timeout 45s) con mensajes amigables
    - Retornar `{response: string, data: array|null}`
    - _Requerimientos: 1.1, 1.3, 1.4, 1.5, 2.2, 2.3, 7.2, 7.3, 7.4, 9.2, 9.5_

  - [x] 2.2 Registrar la ruta pública en `routes/api.php`
    - Agregar grupo `public-assistant` con middlewares `bandwidth_usage` y `throttle:20,1` (sin `auth:sanctum`)
    - Registrar `POST /query` apuntando a `PublicAssistantController@query`
    - _Requerimientos: 1.1, 1.2, 9.4_

  - [ ]* 2.3 Escribir test de propiedad: validación de mensaje
    - **Propiedad 1: Validación de mensaje**
    - Generar cadenas aleatorias y verificar que el endpoint acepte strings de 1-500 caracteres y rechace strings vacíos o >500 caracteres con HTTP 422
    - **Valida: Requerimientos 1.3, 1.4**

  - [ ]* 2.4 Escribir tests unitarios del controlador
    - Test: endpoint sin auth retorna 200 (no requiere `auth:sanctum`)
    - Test: `OPENAI_API_KEY` faltante retorna 503
    - Test: `getToolsDefinitions()` contiene exactamente 5 herramientas
    - Test: `PublicAssistantToolsService` no extiende `AssistantToolsService`
    - Test: `get_vehicle_details` con UUID de vehículo activo retorna datos
    - Test: `get_vehicle_details` con UUID de vehículo inactivo retorna error
    - Test: `confirm_appointment` con cita soft-deleted retorna error
    - Test: `get_appointment_status` con UUID inexistente retorna not found
    - _Requerimientos: 1.1, 1.5, 2.1, 2.4, 5.2, 6.2, 9.1_

- [x] 3. Checkpoint — Verificar backend
  - Asegurar que todos los tests pasen, preguntar al usuario si surgen dudas.

- [x] 4. Crear el servicio PublicAssistantService en el frontend Angular
  - [x] 4.1 Crear `src/app/shared/services/public-assistant.service.ts`
    - Definir interfaces `ChatMessage` (`role: 'user' | 'assistant'`, `content: string`, `timestamp: Date`) y `AssistantResponse` (`response: string`, `data: any | null`)
    - Implementar método `sendMessage(message: string, conversationHistory: ChatMessage[]): Observable<AssistantResponse>` que haga POST a `/api/public-assistant/query` con timeout de 30 segundos
    - Seguir el patrón de los servicios existentes (ej. `assistant.service.ts`)
    - _Requerimientos: 8.3, 8.5_

- [x] 5. Crear el ChatWidgetComponent en el frontend Angular
  - [x] 5.1 Crear componente `src/app/shared/chat-widget/` (standalone component)
    - Implementar botón flotante en esquina inferior derecha (posición fija) con ícono de chat
    - Implementar panel de conversación expandible con lista de burbujas de mensajes
    - Implementar campo de entrada de texto y botón de envío
    - Mostrar mensaje de bienvenida predefinido al abrir el chat por primera vez
    - Implementar indicador de carga (typing indicator) mientras se procesa la solicitud
    - Manejar errores: timeout 30s muestra "No pudimos obtener respuesta. Intenta de nuevo.", error de red muestra "Error de conexión. Verifica tu internet e intenta de nuevo."
    - Persistir historial de mensajes en `sessionStorage` para mantenerlo al cerrar/reabrir el widget durante la misma sesión
    - _Requerimientos: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

  - [ ]* 5.2 Escribir test de propiedad: persistencia de historial de chat (round-trip)
    - **Propiedad 11: Persistencia de historial de chat (round-trip)**
    - Generar secuencias aleatorias de mensajes con fast-check, guardar en sessionStorage y cargar, verificar que la secuencia sea idéntica (roles y contenido intactos)
    - **Valida: Requerimientos 8.6, 8.7**

  - [ ]* 5.3 Escribir tests unitarios del ChatWidgetComponent
    - Test: botón flotante visible en esquina inferior derecha
    - Test: click en botón abre panel con mensaje de bienvenida
    - Test: indicador de carga visible durante solicitud
    - Test: timeout de 30s muestra mensaje de error
    - Test: error de red muestra mensaje amigable
    - _Requerimientos: 8.1, 8.2, 8.4, 8.5_

- [x] 6. Integrar el ChatWidgetComponent en la aplicación
  - [x] 6.1 Agregar `<app-chat-widget>` en `app.component.html` para que aparezca en todas las páginas públicas
    - Importar `ChatWidgetComponent` en el módulo o componente raíz correspondiente
    - Verificar que el widget no interfiera con el layout existente ni con el botón de WhatsApp (`sticky-whatsapp`)
    - _Requerimientos: 8.1_

- [x] 7. Checkpoint final — Verificar integración completa
  - Asegurar que todos los tests pasen, preguntar al usuario si surgen dudas.

## Notas

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada tarea referencia requerimientos específicos para trazabilidad
- Los checkpoints aseguran validación incremental
- Los tests de propiedad validan propiedades universales de correctitud
- Los tests unitarios validan ejemplos específicos y casos borde
