# Propuesta: módulo ABCars CarWash + WhatsApp (Twilio)

**Proyecto:** nuevo-abcars (ABCars)  
**Fecha:** 2026-09-07  
**Estado:** propuesta para revisión  
**Alcance de este documento:** definición funcional, técnica y de fases. No incluye implementación.

---

## 1. Resumen ejecutivo

Se propone integrar **ABCars CarWash** como un módulo nuevo del ecosistema ABCars, reutilizando la arquitectura actual (Laravel API, panel Angular admin, app Ionic y asistente con function calling).

El módulo cubre:

1. **Operación de lavado:** agenda de citas, control de estatus, gestión de lavadores.
2. **Punto de venta (POS) web:** venta de servicios de lavado y productos de amenidades.
3. **Canal WhatsApp:** bot de atención con Twilio, apoyado en la infraestructura de agente existente.
4. **Notificaciones:** avisos de estatus de lavado por WhatsApp.
5. **App móvil (fase posterior):** extensión del flujo a la app de valuación / operación móvil.

Objetivo de negocio: digitalizar la operación del car wash, reducir fricción en agenda y cobro, y unificar atención al cliente en el mismo ecosistema de marca ABCars.

---

## 2. Contexto y alineación con ABCars

### 2.1 Stack actual a reutilizar

| Capa | Tecnología actual | Uso en CarWash |
|------|-------------------|----------------|
| API | Laravel (`abcars-backend`) | Dominio CarWash, POS, webhooks Twilio, jobs de notificación |
| Admin | Angular (`abcars-frontend` / administrador) | Operación, agenda, lavadores, catálogo, reportes, POS |
| Móvil | Ionic (`abcars-valuation-ionic`) | Fase 2: operación en piso / estatus / escaneo |
| Asistente | OpenAI function calling (`PublicAssistant` / `Assistant`) | Cerebro conversacional del bot WhatsApp |
| Auth / roles | Sanctum + Spatie permissions | Roles `carwash_*`, permisos por acción |
| Media | S3 + CloudFront (optimizer local) | Evidencias de lavado, fotos de amenidades |
| Mensajería | *(nuevo)* Twilio WhatsApp | Canal de entrada/salida |

### 2.2 Principios de diseño

- **Módulo acotado:** prefijo de rutas/API `carwash/*` y menú admin propio, sin acoplar inventario de seminuevos.
- **Reuso del agente:** el bot WhatsApp no inventa otra IA; llama tools del dominio CarWash (y, si aplica, inventario ABCars).
- **Idempotencia:** cada mensaje Twilio se procesa una sola vez (MessageSid).
- **Trazabilidad:** cada cita y venta generan auditoría (quién, cuándo, canal: web / WhatsApp / POS / app).
- **Fases:** MVP operable en web + WhatsApp; móvil y analítica avanzada después.

---

## 3. Alcance funcional

### 3.1 Agenda de citas de lavado

- Crear / reprogramar / cancelar citas.
- Disponibilidad por sede (dealership o nueva entidad `carwash_location`), bahía y duración del servicio.
- Tipos de servicio (ej. express, completo, detailing, moto).
- Datos del cliente: nombre, teléfono (E.164), vehículo (placas / marca / modelo / color).
- Origen de la cita: web admin, POS, WhatsApp, (futuro) app.

### 3.2 Control de citas y estatus de lavado

Flujo de estatus propuesto (configurable):

```
draft → scheduled → checked_in → in_progress → ready → delivered
                 ↘ cancelled
                 ↘ no_show
```

- Tablero operativo (kanban / lista del día) por sede y turno.
- Asignación de lavador y bahía.
- Tiempos: check-in, inicio, fin, entrega.
- Evidencia fotográfica opcional (antes/después) vía S3/CloudFront.

### 3.3 Gestión de lavadores

- Catálogo de lavadores (usuarios con rol o entidad `carwash_washer` ligada a `users`).
- Turnos / disponibilidad.
- Asignación a citas y carga de trabajo del día.
- Métricas básicas: lavados completados, tiempo promedio (fase 1.5).

### 3.4 Punto de venta web (POS)

Pantalla admin optimizada para caja / mostrador:

- Cobro de servicio de lavado (cita existente o venta walk-in).
- Venta de **productos de amenidades** (aromatizantes, fundas, etc.): catálogo, stock simple, precio.
- Métodos de pago: efectivo, tarjeta, transferencia, mixto (configurable).
- Ticket / comprobante digital (PDF o enlace) y opcional envío por WhatsApp.
- Corte de caja diario por sede / cajero.

### 3.5 WhatsApp Bot (Twilio + agente ABCars)

Canal de atención al cliente vía WhatsApp Business (Twilio):

| Capacidad | Descripción |
|-----------|-------------|
| Agenda | Consultar horarios, crear / confirmar / cancelar cita |
| Seguimiento | “¿Cómo va mi auto?” → estatus actual |
| Notificaciones | Push saliente al cambiar estatus (ej. “Tu auto está listo”) |
| FAQ / cross-sell | Info de paquetes; opcional puente a inventario ABCars |
| Handoff | Escalar a humano (cola interna / notificación admin) |

Arquitectura conversacional:

1. Twilio recibe mensaje → webhook Laravel.
2. Normalización + identificación de cliente por teléfono.
3. Orquestador reutiliza patrón del asistente (OpenAI + **tools CarWash**).
4. Respuesta → Twilio WhatsApp API.
5. Eventos de negocio (cambio de estatus) → job de notificación WhatsApp.

### 3.6 App móvil (fase siguiente)

No entra en MVP web, pero se diseña desde el inicio:

- App operativa para lavadores / supervisor: ver cola, cambiar estatus, tomar foto.
- (Opcional) cliente: ver estatus de su lavado.
- Misma API `carwash/*`; sin lógica duplicada.

---

## 4. Actores y permisos

| Rol | Capacidades principales |
|-----|-------------------------|
| `carwash_admin` | Configuración, catálogo, reportes, lavadores, sedes |
| `carwash_supervisor` | Tablero del día, asignación, overrides de estatus |
| `carwash_cashier` | POS, tickets, corte de caja |
| `carwash_washer` | Ver citas asignadas, avanzar estatus, evidencias |
| `carwash_agent` | Atención / handoff (panel mensajes) |
| Cliente (WhatsApp) | Agenda y consulta vía bot (sin login Sanctum) |

Permisos Spatie sugeridos: `carwash.appointments.*`, `carwash.pos.*`, `carwash.washers.*`, `carwash.catalog.*`, `carwash.reports.view`, `carwash.whatsapp.manage`.

---

## 5. Modelo de datos (borrador)

Prefijo tablas: `carwash_` (con `DB_TABLE_PREFIX` si aplica).

### Entidades núcleo

- `carwash_locations` — sede / plaza del lavado (puede mapear a `dealerships`).
- `carwash_service_types` — paquetes (nombre, duración min, precio, activo).
- `carwash_bays` — bahías por sede.
- `carwash_washers` — lavadores (user_id, sede, activo).
- `carwash_appointments` — citas (cliente, vehículo, servicio, estatus, washer, bay, canal, timestamps).
- `carwash_appointment_status_logs` — historial de estatus.
- `carwash_products` — amenidades (SKU, precio, stock).
- `carwash_orders` / `carwash_order_items` — venta POS (servicios + productos).
- `carwash_payments` — pagos por orden.
- `carwash_whatsapp_conversations` — hilo por teléfono.
- `carwash_whatsapp_messages` — mensajes in/out (Twilio SID, dirección, payload).
- `carwash_notification_outbox` — cola de notificaciones (idempotente).

### Relaciones clave

```
Location 1—N Bay | Washer | Appointment | Order
Appointment N—1 ServiceType, Washer?, Bay?, Order?
Order 1—N OrderItem (service | product)
Phone → Conversation 1—N Message
Appointment → StatusLog, NotificationOutbox
```

---

## 6. Arquitectura técnica propuesta

```
┌─────────────────┐     ┌──────────────────────┐
│ Angular Admin   │────▶│ Laravel API          │
│ Agenda / POS /  │     │ /api/carwash/*       │
│ Lavadores       │     │ /api/webhooks/twilio │
└─────────────────┘     └──────────┬───────────┘
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         ▼                         ▼                         ▼
┌─────────────────┐     ┌──────────────────────┐   ┌─────────────────┐
│ Domain Services │     │ Agent Orchestrator   │   │ Queue / Jobs    │
│ Appointments    │     │ (OpenAI + tools)     │   │ NotifyWhatsApp  │
│ POS / Inventory │     │ CarWashToolsService  │   │ SyncTwilio      │
└─────────────────┘     └──────────┬───────────┘   └────────┬────────┘
                                   │                        │
                                   └──────────┬─────────────┘
                                              ▼
                                    ┌──────────────────┐
                                    │ Twilio WhatsApp  │
                                    └──────────────────┘
                                              ▲
┌─────────────────┐                           │
│ Ionic App       │── (fase 2) ───────────────┘
│ Operación piso  │     misma API carwash
└─────────────────┘
```

### 6.1 API (borrador)

```
GET/POST   /api/carwash/appointments
PATCH      /api/carwash/appointments/{uuid}/status
GET        /api/carwash/board?date=&location=
CRUD       /api/carwash/service-types
CRUD       /api/carwash/products
CRUD       /api/carwash/washers
POST       /api/carwash/pos/checkout
GET        /api/carwash/pos/shifts/current
POST       /api/carwash/pos/shifts/close
POST       /api/webhooks/twilio/whatsapp   (público, firmado)
POST       /api/carwash/whatsapp/send      (interno / admin)
```

### 6.2 Extensión del agente

Nuevo `CarWashAssistantToolsService` (o extensión del público) con tools, por ejemplo:

- `carwash_get_availability`
- `carwash_create_appointment`
- `carwash_cancel_appointment`
- `carwash_get_appointment_status`
- `carwash_list_services`
- `carwash_handoff_to_human`

El webhook Twilio autentica el mensaje, resuelve conversación y llama al orquestador con system prompt específico de CarWash + políticas (no inventar precios, confirmar antes de agendar, etc.).

### 6.3 Notificaciones WhatsApp

Trigger al cambiar estatus (en `AppointmentStatusService`):

| Estatus | Mensaje ejemplo |
|---------|-----------------|
| `checked_in` | Recibimos tu auto, iniciaremos pronto. |
| `in_progress` | Tu auto ya está en lavado. |
| `ready` | ¡Listo! Puedes pasar a recogerlo. |
| `delivered` | Gracias por visitarnos. |

Encolar en `carwash_notification_outbox` + job con reintentos; respetar opt-in / horario.

### 6.4 Twilio

- WhatsApp Sender / Sandbox → producción con número Business aprobado.
- Validación de firma en webhook.
- Plantillas (Content API) para mensajes proactivos fuera de la ventana de 24 h.
- Variables Railway: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM`, `TWILIO_WEBHOOK_SECRET`.

---

## 7. UI Admin (Angular)

Nuevo grupo de navegación **CarWash**:

1. **Tablero del día** — kanban/lista por estatus.
2. **Agenda** — calendario / slots.
3. **POS** — pantalla de cobro (servicios + amenidades).
4. **Catálogo** — servicios y productos.
5. **Lavadores** — alta, turnos, asignación.
6. **WhatsApp** — bandeja de conversaciones + handoff (fase 1.5).
7. **Reportes** — lavados/día, ticket promedio, productos top (fase 1.5).

Diseño: seguir shell admin existente (`admin-shell` + `administrator-nav.config`).

---

## 8. Fases de entrega

### Fase 0 — Descubrimiento (3–5 días)
- Validar sedes, catálogo real de servicios/precios, flujo de caja actual.
- Alta Twilio WhatsApp (sandbox → número).
- Definir copy de mensajes y plantillas.

### Fase 1 — MVP operable (recomendado)
- Modelo de datos + API citas / estatus / lavadores / servicios.
- Admin: agenda + tablero + lavadores.
- POS básico (servicio + 1 método de pago + ticket).
- WhatsApp: webhook + agent tools (agenda + estatus) + notificaciones `ready` / `in_progress`.
- Roles y permisos.

**Criterio de éxito MVP:** agenda del día operable en admin, cobro en POS, cliente recibe WhatsApp al estar listo.

### Fase 1.5 — Endurecimiento
- Amenidades con stock y corte de caja.
- Bandeja WhatsApp + handoff humano.
- Evidencias fotográficas.
- Reportes básicos.
- Plantillas Twilio para proactivos.

### Fase 2 — App móvil
- App lavador/supervisor (cola, estatus, foto).
- Push opcional / deep links a cita.
- Mejoras UX POS (lector, impresora térmica si aplica).

### Fase 3 — Expansión
- Multisede avanzada, paquetes/membresías, fidelización.
- Cross-sell con inventario ABCars desde el bot.
- Analítica y ocupación por bahía.

---

## 9. Estimación de esfuerzo (orden de magnitud)

| Fase | Esfuerzo relativo |
|------|-------------------|
| Fase 0 | 0.5–1 semana |
| Fase 1 MVP | 3–5 semanas |
| Fase 1.5 | 2–3 semanas |
| Fase 2 móvil | 3–4 semanas |

Depende de complejidad de POS (fiscal/CFDI), número de sedes y aprobación de plantillas WhatsApp en Meta/Twilio.

---

## 10. Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| Aprobación lenta de WhatsApp templates | Empezar con sandbox + ventana 24 h; plantillas en paralelo |
| Costos Twilio / OpenAI | Rate limits, caché de FAQs, tools acotados |
| Confusión de citas duplicadas | Idempotencia por teléfono + slot + confirmación explícita |
| Stock de amenidades incorrecto | Movimientos de inventario en cada venta POS |
| Acoplamiento con seminuevos | Dominio `carwash_*` separado; bridges opcionales |
| Caché frontend Angular tras deploys | Ya observado en prod; versionado/CDN y hard refresh documentado |

---

## 11. Fuera de alcance (MVP)

- Facturación electrónica CFDI (salvo que se priorice).
- App cliente nativa completa.
- Integración con pasarelas de pago en línea (Stripe/Mercado Pago) — POS presencial primero.
- CRM marketing masivo por WhatsApp (solo transaccional + atención).
- Multi-moneda / franquicias externas.

---

## 12. Entregables de la propuesta (siguientes pasos)

Si se aprueba este documento:

1. **Wireframes** Tablero + POS + flujo WhatsApp (textos).
2. **OpenAPI** preliminar `carwash/*`.
3. **Checklist Twilio** (cuenta, sender, webhook, plantillas).
4. **Backlog en issues** por fase (Gantt / GitHub).
5. Spike técnico 2–3 días: webhook Twilio + 1 tool `carwash_get_appointment_status` end-to-end.

---

## 13. Decisión solicitada

Se pide validar:

1. ¿El MVP (Fase 1) es el alcance correcto para arrancar?
2. ¿Las sedes CarWash se ligan a `dealerships` existentes o son entidades nuevas?
3. ¿Prioridad de POS con amenidades en MVP o solo servicios de lavado?
4. ¿El bot WhatsApp debe también hablar de inventario de autos ABCars desde el día 1, o solo CarWash?

---

## 14. Anexos

### A. Ejemplo de mensaje de estatus (ready)

> Hola {nombre}, tu {marca} {modelo} (placas {placas}) ya está **listo** para recoger en {sede}.  
> Horario de entrega: {horario}.  
> ¿Necesitas algo más? Responde a este chat.

### B. Ejemplo de tool call del agente

```json
{
  "name": "carwash_create_appointment",
  "arguments": {
    "phone": "+52155...",
    "service_code": "completo",
    "location_id": 1,
    "starts_at": "2026-09-10T10:00:00-06:00",
    "vehicle_plates": "ABC123A",
    "customer_name": "Juan Pérez"
  }
}
```

### C. Dependencias de infraestructura

- Railway: servicio API + worker queue (notificaciones).
- Twilio WhatsApp.
- OpenAI (`OPENAI_API_KEY` ya usado por asistentes).
- S3/CloudFront (evidencias / imágenes de productos).

---

*Documento generado para ABCars — módulo CarWash. Siguiente paso: revisión de negocio y kickoff Fase 0.*

---

## 15. Avance de implementación (sandbox)

**Inicio:** 2026-09-08 en rama `sanboxNuevoABcars`.

### Entregado en esta base

- Migración `2026_09_08_120000_create_carwash_tables.php`
- Modelos `App\Models\CarWash\*`
- API autenticada `/api/carwash/*` (board, appointments, catalog)
- `CarWashAppointmentService` (crear + cambiar estatus + logs)
- Seeder `CarWashSeeder` (permisos, roles, sede demo, servicios default)
- Admin Angular: Tablero + Nueva cita + nav **CarWash**
- Propuesta en `docs/propuesta-modulo-carwash-whatsapp.md`

### Pendiente siguiente

- POS y amenidades UI
- WhatsApp Twilio webhook + tools del agente
- Notificaciones de estatus
- Ejecutar en Railway sandbox: `php artisan migrate` + `php artisan db:seed --class=CarWashSeeder`
