# Documento de Requerimientos — Asistente Público (Chatbot)

## Introducción

Este documento define los requerimientos para un asistente conversacional (chatbot) orientado al público general de ABCars. A diferencia del asistente interno existente (restringido a administradores), este asistente estará disponible sin autenticación y limitado estrictamente a cinco capacidades: consulta de inventario público de vehículos, generación de citas, confirmación de citas, consulta de estatus de citas y preguntas sobre el inventario publicado. El asistente no tendrá acceso a datos internos como valuaciones, usuarios, estadísticas ni ninguna otra funcionalidad del sistema.

## Glosario

- **Asistente_Público**: Chatbot conversacional basado en IA (OpenAI) expuesto al público sin autenticación, accesible desde el frontend web de ABCars.
- **Inventario_Público**: Conjunto de vehículos con `page_status = 'active'` en la base de datos, visibles en el sitio web público.
- **Cita**: Registro en la tabla `customer_appointments` que representa una cita agendada por un cliente para visitar una sucursal.
- **Sucursal**: Concesionario/agencia de ABCars registrado en la tabla `dealerships`.
- **Visitante**: Usuario público que interactúa con el Asistente_Público sin necesidad de autenticación.
- **Código_de_Cita**: Identificador UUID único de una cita que permite al Visitante consultar o confirmar su cita.
- **API_Backend**: API REST de Laravel que expone los endpoints del Asistente_Público en `abcars-backend`.
- **Widget_Chat**: Componente visual de Angular en `abcars-frontend` que presenta la interfaz de conversación al Visitante.

## Requerimientos

### Requerimiento 1: Endpoint público del Asistente

**Historia de Usuario:** Como visitante del sitio web de ABCars, quiero interactuar con un asistente sin necesidad de iniciar sesión, para poder obtener información sobre vehículos y gestionar citas de forma rápida.

#### Criterios de Aceptación

1. THE API_Backend SHALL exponer un endpoint POST `/api/public-assistant/query` sin requerir autenticación (sin middleware `auth:sanctum`).
2. THE API_Backend SHALL aplicar rate limiting al endpoint del Asistente_Público para limitar a un máximo de 20 solicitudes por minuto por dirección IP.
3. WHEN el Visitante envía un mensaje, THE API_Backend SHALL validar que el campo `message` sea una cadena de texto con un máximo de 500 caracteres.
4. IF el campo `message` está vacío o excede 500 caracteres, THEN THE API_Backend SHALL retornar un error de validación con código HTTP 422.
5. IF la clave OPENAI_API_KEY no está configurada en el entorno, THEN THE API_Backend SHALL retornar un código HTTP 503 con un mensaje indicando que el asistente no está disponible.

---

### Requerimiento 2: Restricción de capacidades del Asistente

**Historia de Usuario:** Como administrador de ABCars, quiero que el asistente público esté limitado exclusivamente a cinco funciones, para evitar que exponga datos internos o funcionalidades administrativas.

#### Criterios de Aceptación

1. THE Asistente_Público SHALL tener acceso únicamente a las siguientes cinco herramientas (tools): `search_public_vehicles`, `get_vehicle_details`, `create_appointment`, `confirm_appointment` y `get_appointment_status`.
2. THE Asistente_Público SHALL utilizar un prompt de sistema que instruya al modelo de IA a rechazar cualquier consulta fuera del ámbito de inventario público y gestión de citas.
3. WHEN el Visitante realiza una pregunta fuera del ámbito permitido (por ejemplo, datos de usuarios, valuaciones, estadísticas internas), THE Asistente_Público SHALL responder indicando que solo puede ayudar con información de vehículos disponibles y gestión de citas.
4. THE Asistente_Público SHALL operar con un servicio de herramientas independiente (`PublicAssistantToolsService`) separado del servicio interno existente (`AssistantToolsService`).
5. THE Asistente_Público SHALL consultar únicamente vehículos con `page_status = 'active'` y no exponer campos internos como `id`, `purchase_date`, `vin` ni `sale_price`.

---

### Requerimiento 3: Consulta de inventario público de vehículos

**Historia de Usuario:** Como visitante, quiero buscar vehículos disponibles por marca, modelo, tipo, rango de precio o palabra clave, para encontrar el auto que me interesa.

#### Criterios de Aceptación

1. WHEN el Visitante pregunta por vehículos disponibles, THE Asistente_Público SHALL ejecutar la herramienta `search_public_vehicles` filtrando exclusivamente vehículos con `page_status = 'active'`.
2. THE herramienta `search_public_vehicles` SHALL aceptar parámetros opcionales: `keyword` (texto libre), `brand` (marca), `type` (nuevo/seminuevo), `min_price` y `max_price` (rango de precio de lista).
3. THE herramienta `search_public_vehicles` SHALL retornar un máximo de 10 vehículos por consulta, ordenados por fecha de creación descendente.
4. THE herramienta `search_public_vehicles` SHALL incluir para cada vehículo únicamente: nombre, marca, línea, modelo (año), precio de lista, precio de oferta, kilometraje, tipo de combustible, transmisión, color exterior, categoría, sucursal y URL de la primera imagen.
5. WHEN el Visitante pregunta por un vehículo específico, THE Asistente_Público SHALL ejecutar la herramienta `get_vehicle_details` usando el UUID del vehículo para retornar información detallada incluyendo todas las imágenes disponibles y especificaciones.

---

### Requerimiento 4: Generación de citas

**Historia de Usuario:** Como visitante, quiero agendar una cita para visitar una sucursal y ver un vehículo, para planificar mi visita de forma conveniente.

#### Criterios de Aceptación

1. WHEN el Visitante solicita agendar una cita, THE Asistente_Público SHALL recopilar mediante conversación los datos requeridos: nombre del cliente, teléfono, correo electrónico, sucursal deseada, fecha y hora preferida, y opcionalmente el vehículo de interés.
2. THE herramienta `create_appointment` SHALL validar que el nombre tenga al menos 2 caracteres, el teléfono tenga 10 dígitos, el correo electrónico tenga formato válido y la fecha programada sea futura.
3. IF algún dato requerido falta o es inválido, THEN THE Asistente_Público SHALL solicitar al Visitante que proporcione o corrija la información faltante antes de crear la cita.
4. WHEN todos los datos son válidos, THE herramienta `create_appointment` SHALL crear un registro de Customer (si no existe por teléfono o correo) y un registro de CustomerAppointment con `type = 'visit'` y `status = 'scheduled'`.
5. WHEN la cita se crea exitosamente, THE Asistente_Público SHALL retornar al Visitante el Código_de_Cita (UUID), la fecha programada y el nombre de la sucursal como confirmación.
6. THE herramienta `create_appointment` SHALL consultar las sucursales disponibles de la tabla `dealerships` para validar que la sucursal seleccionada exista.

---

### Requerimiento 5: Confirmación de citas

**Historia de Usuario:** Como visitante que ya agendó una cita, quiero confirmar mi asistencia, para que la sucursal sepa que asistiré.

#### Criterios de Aceptación

1. WHEN el Visitante proporciona un Código_de_Cita y solicita confirmar, THE herramienta `confirm_appointment` SHALL buscar la cita por UUID en la tabla `customer_appointments`.
2. IF la cita no existe o está eliminada (soft deleted), THEN THE Asistente_Público SHALL informar al Visitante que el código de cita no es válido.
3. IF la cita tiene un `status` diferente de `scheduled`, THEN THE Asistente_Público SHALL informar al Visitante el estado actual de la cita sin modificarla.
4. WHEN la cita existe y tiene `status = 'scheduled'`, THE herramienta `confirm_appointment` SHALL actualizar el `status` a `confirmed`.
5. WHEN la confirmación es exitosa, THE Asistente_Público SHALL retornar al Visitante la fecha programada, la sucursal y el estado actualizado como confirmación.

---

### Requerimiento 6: Consulta de estatus de citas

**Historia de Usuario:** Como visitante, quiero consultar el estado de mi cita usando mi código, para saber si está pendiente, confirmada o completada.

#### Criterios de Aceptación

1. WHEN el Visitante proporciona un Código_de_Cita y pregunta por el estatus, THE herramienta `get_appointment_status` SHALL buscar la cita por UUID.
2. IF la cita no existe, THEN THE Asistente_Público SHALL informar al Visitante que no se encontró una cita con ese código.
3. WHEN la cita existe, THE herramienta `get_appointment_status` SHALL retornar: estado actual, fecha programada, nombre de la sucursal y tipo de cita.
4. THE herramienta `get_appointment_status` SHALL omitir datos internos como `customer_id`, `vehicle_id`, `referrer_user_id` y cualquier información de valuación asociada.

---

### Requerimiento 7: Preguntas sobre el inventario publicado

**Historia de Usuario:** Como visitante, quiero hacer preguntas generales sobre el inventario (por ejemplo, "¿tienen SUVs automáticas?" o "¿cuál es el auto más barato?"), para obtener respuestas útiles sin navegar todo el sitio.

#### Criterios de Aceptación

1. WHEN el Visitante hace una pregunta general sobre el inventario, THE Asistente_Público SHALL utilizar la herramienta `search_public_vehicles` con los filtros apropiados derivados de la pregunta.
2. THE Asistente_Público SHALL interpretar preguntas en lenguaje natural sobre tipo de vehículo, rango de precio, transmisión, combustible, marca y categoría, y traducirlas a los parámetros de búsqueda correspondientes.
3. WHEN el Visitante pregunta por disponibilidad de sucursales, THE Asistente_Público SHALL listar las sucursales activas con nombre, ubicación y dirección.
4. THE Asistente_Público SHALL responder siempre en español, de forma clara, amigable y concisa.

---

### Requerimiento 8: Widget de chat en el frontend

**Historia de Usuario:** Como visitante del sitio web, quiero ver un botón flotante de chat que me permita abrir una ventana de conversación, para interactuar con el asistente de forma intuitiva.

#### Criterios de Aceptación

1. THE Widget_Chat SHALL mostrarse como un botón flotante en la esquina inferior derecha de todas las páginas públicas del frontend Angular.
2. WHEN el Visitante hace clic en el botón flotante, THE Widget_Chat SHALL abrir un panel de conversación con un mensaje de bienvenida predefinido.
3. THE Widget_Chat SHALL enviar cada mensaje del Visitante al endpoint `POST /api/public-assistant/query` y mostrar la respuesta del Asistente_Público en formato de burbuja de chat.
4. WHILE el Asistente_Público procesa una solicitud, THE Widget_Chat SHALL mostrar un indicador de carga (typing indicator) al Visitante.
5. IF la solicitud al backend falla o excede 30 segundos de timeout, THEN THE Widget_Chat SHALL mostrar un mensaje de error amigable sugiriendo intentar de nuevo.
6. THE Widget_Chat SHALL mantener el historial de la conversación actual en memoria del navegador durante la sesión activa.
7. WHEN el Visitante cierra y reabre el Widget_Chat durante la misma sesión de navegación, THE Widget_Chat SHALL preservar el historial de mensajes previos.

---

### Requerimiento 9: Seguridad y aislamiento de datos

**Historia de Usuario:** Como administrador de ABCars, quiero garantizar que el asistente público no pueda acceder a datos sensibles del sistema, para proteger la información interna del negocio.

#### Criterios de Aceptación

1. THE PublicAssistantToolsService SHALL ser una clase independiente que no herede ni reutilice métodos del AssistantToolsService interno existente.
2. THE Asistente_Público SHALL utilizar un controlador separado (`PublicAssistantController`) con su propio conjunto de herramientas y prompt de sistema.
3. THE Asistente_Público SHALL excluir de todas las respuestas los campos: `id`, `vin`, `purchase_date`, `sale_price`, `customer_id`, `vehicle_id`, `referrer_user_id`, `deleted_at` y cualquier dato de valuación.
4. THE API_Backend SHALL aplicar el middleware `bandwidth_usage` al endpoint del Asistente_Público para monitorear el consumo de ancho de banda.
5. THE API_Backend SHALL registrar en los logs cada consulta al Asistente_Público incluyendo la dirección IP y el mensaje enviado, sin almacenar datos personales del Visitante.
