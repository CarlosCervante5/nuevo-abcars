# Credenciales de Prueba - ABCars

## 🔐 USUARIOS DE PRUEBA (CREADOS Y LISTOS)

### 1. Cliente
- **Email**: `test@abcars.mx`
- **Password**: `TestUser2024%%`
- **Rol**: `client`
- **ID**: 8
- **Nickname**: `test_user`

### 2. Técnico
- **Email**: `tecnico@abcars.mx`
- **Password**: `Tecnico2024%%`
- **Rol**: `technician`
- **ID**: 9
- **Nickname**: `tecnico_prueba`

### 3. Valuador
- **Email**: `valuador@abcars.mx`
- **Password**: `Valuador2024%%`
- **Rol**: `valuator`
- **ID**: 10
- **Nickname**: `valuador_prueba`

### 4. Gestor
- **Email**: `gestor_prueba@abcars.mx`
- **Password**: `Gestor2024%%`
- **Rol**: `gestor`
- **ID**: 11
- **Nickname**: `gestor_prueba`

### 5. Vendedor
- **Email**: `vendedor@abcars.mx`
- **Password**: `Vendedor2024%%`
- **Rol**: `seller`
- **ID**: 13
- **Nickname**: `vendedor_prueba`

### 6. Marketing
- **Email**: `marketing_prueba@abcars.mx`
- **Password**: `Marketing2024%%`
- **Rol**: `marketing`
- **ID**: 14
- **Nickname**: `marketing_prueba`

### 7. Administrador
- **Email**: `admin_prueba@abcars.mx`
- **Password**: `Admin2024%%`
- **Rol**: `administrator`
- **ID**: 15
- **Nickname**: `admin_prueba`

### 8. Refacciones
- **Email**: `refacciones@abcars.mx`
- **Password**: `Refacciones2024%%`
- **Rol**: `spare_parts`
- **ID**: 16
- **Nickname**: `refacciones_prueba`

---

## Usuarios de Sistema (SQLite - Desarrollo Local)

### 1. Manager
- **Email**: `manager@abcars.mx`
- **Nickname**: `manager`
- **ID**: 1
- **Password**: *(desconocida - hash bcrypt en BD)*

### 2. Administrador
- **Email**: `admin@abcars.mx`
- **Nickname**: `administrador`
- **ID**: 2
- **Password**: *(desconocida - hash bcrypt en BD)*

### 3. Gestor
- **Email**: `gestor@abcars.mx`
- **Nickname**: `gestor`
- **ID**: 3
- **Password**: *(desconocida - hash bcrypt en BD)*

### 4. Staff
- **Email**: `staff@abcars.mx`
- **Nickname**: `staff`
- **ID**: 4
- **Password**: *(desconocida - hash bcrypt en BD)*

---

## Usuarios de Staff con Credenciales Conocidas (Seeders)

Para crear un usuario de prueba con contraseña conocida, ejecuta:

```sql
-- Contraseña: password123
-- Hash SHA256: ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f

INSERT INTO users (name, surname, email, password, gender, created_at, updated_at) 
VALUES ('Test', 'User', 'test@abcars.mx', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'm', NOW(), NOW());

-- Asignar rol de cliente (role_id = 3)
INSERT INTO model_has_roles (role_id, model_type, model_id) 
VALUES (3, 'App\\Models\\User', LAST_INSERT_ID());
```

## ✅ Login Verificado y Funcionando

El login ha sido probado exitosamente con el usuario de prueba:

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@abcars.mx", "password": "TestUser2024%%"}'
```

**Respuesta exitosa:**
```json
{
  "status": 200,
  "message": "Login correcto",
  "data": {
    "token": "1|...",
    "user": {
      "uuid": "5cd79659-408a-48d2-8b79-d0820b27bf92",
      "nickname": "test_user",
      "email": "test@abcars.mx"
    },
    "role": "client",
    "profile": null
  }
}
```

## Roles Disponibles en el Sistema

1. **developer** - Desarrollador (acceso total)
2. **marketing** - Marketing
3. **client** - Cliente
4. **appraiser** - Tasador
5. **valuator** - Valuador
6. **appraiser_technician** - Técnico Tasador
7. **sales** - Ventas
8. **aftersales** - Post-venta
9. **gestor** - Gestor
10. **spare_parts** - Refacciones
11. **technician** - Técnico
12. **bodywork_paint_technician** - Técnico de Hojalatería y Pintura

## Nota sobre Contraseñas

Las contraseñas en la base de datos están hasheadas con **SHA256**. Para hashear una nueva contraseña:

```bash
php artisan tinker --execute="echo hash('sha256', 'tu_contraseña');"
```

