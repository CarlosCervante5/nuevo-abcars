#!/bin/bash

# Script para probar solicitudes de valuación con referido
# Las solicitudes aparecerán en "Mis referidos" del vendedor (seller) en el dashboard
#
# Uso:
#   ./test-referral-requests.sh [REFERRER_UUID]
#   REFERRER_UUID=xxx ./test-referral-requests.sh
#
# Para obtener el UUID de un seller:
#   php artisan tinker --execute="echo App\Models\User::role('seller')->first()?->uuid ?? 'No hay sellers';"

BASE_URL="${BASE_URL:-http://localhost:8000}"
REFERRER_UUID="${1:-$REFERRER_UUID}"

# Email único para cada prueba (evitar conflictos con clientes existentes)
TIMESTAMP=$(date +%s)
TEST_EMAIL="test.referido.${TIMESTAMP}@abcars-test.mx"

echo "=========================================="
echo "Prueba de solicitudes con referido"
echo "=========================================="
echo "Base URL: $BASE_URL"
echo ""

if [ -z "$REFERRER_UUID" ]; then
    echo "ERROR: Debes proporcionar el UUID del vendedor (referrer)."
    echo ""
    echo "Para obtener el UUID de un seller, ejecuta:"
    echo "  cd abcars-backend && php artisan tinker --execute=\"echo App\\\\Models\\\\User::role('seller')->first()?->uuid ?? 'No hay sellers';\""
    echo ""
    echo "Uso: ./test-referral-requests.sh REFERRER_UUID"
    echo "  o:  REFERRER_UUID=xxx ./test-referral-requests.sh"
    exit 1
fi

echo "Referrer UUID: $REFERRER_UUID"
echo ""

# Paso 1: Registrar cliente (interno, sin auth)
echo "1. Registrando cliente de prueba..."
REGISTER_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/auth/iternally_register" \
  -H "Content-Type: application/json" \
  -H "X-Requested-With: XMLHttpRequest" \
  -d "{
    \"name\": \"Cliente\",
    \"last_name\": \"Referido Test ${TIMESTAMP}\",
    \"email\": \"${TEST_EMAIL}\",
    \"phone_1\": \"5512345678\"
  }")

# Extraer customer_uuid de la respuesta (data.profile.uuid)
# Prioridad: jq > python > grep/sed
if command -v jq &> /dev/null; then
    CUSTOMER_UUID=$(echo "$REGISTER_RESPONSE" | jq -r '.data.profile.uuid // .data.user.uuid // empty')
elif command -v python3 &> /dev/null; then
    CUSTOMER_UUID=$(echo "$REGISTER_RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); p=d.get('data',{}).get('profile',d.get('data',{}).get('user',{})); print(p.get('uuid','') if isinstance(p,dict) else '')" 2>/dev/null)
else
    # Fallback: buscar el primer uuid en la respuesta (profile suele estar después de user)
    CUSTOMER_UUID=$(echo "$REGISTER_RESPONSE" | grep -oE '"uuid"\s*:\s*"[a-f0-9-]{36}"' | tail -1 | grep -oE '[a-f0-9-]{36}')
fi

if [ -z "$CUSTOMER_UUID" ]; then
    echo "   Respuesta: $REGISTER_RESPONSE"
    echo ""
    echo "ERROR: No se pudo obtener el customer_uuid. ¿El cliente ya existe?"
    echo "   Intenta con otro timestamp o verifica que el backend esté corriendo."
    exit 1
fi

echo "   OK - Customer UUID: $CUSTOMER_UUID"
echo ""

# Paso 2: Crear cita de valuación con referrer_uuid
echo "2. Creando cita de valuación con referido..."
# Fecha en 7 días (macOS: -v+7d, Linux: -d "+7 days")
if date -v+7d +%Y-%m-%d &>/dev/null; then
    SCHEDULED_DATE=$(date -v+7d +%Y-%m-%d)
else
    SCHEDULED_DATE=$(date -d "+7 days" +%Y-%m-%d 2>/dev/null || echo "2025-02-05")
fi
SCHEDULED_DATETIME="${SCHEDULED_DATE} 10:00"

APPOINTMENT_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/api/appointment" \
  -H "Content-Type: application/json" \
  -H "X-Requested-With: XMLHttpRequest" \
  -d "{
    \"type\": \"valuation\",
    \"customer_uuid\": \"${CUSTOMER_UUID}\",
    \"brand_name\": \"Honda\",
    \"model_name\": \"Civic\",
    \"year\": 2021,
    \"mileage\": 35000,
    \"scheduled_date\": \"${SCHEDULED_DATETIME}\",
    \"dealership_name\": \"VECSA pachuca\",
    \"referrer_uuid\": \"${REFERRER_UUID}\"
  }")

HTTP_CODE=$(echo "$APPOINTMENT_RESPONSE" | tail -n1)
APPOINTMENT_BODY=$(echo "$APPOINTMENT_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "201" ]; then
    echo "   OK - Cita creada exitosamente (HTTP $HTTP_CODE)"
    echo ""
    echo "=========================================="
    echo "Prueba completada"
    echo "=========================================="
    echo ""
    echo "La solicitud debería aparecer en:"
    echo "  - Dashboard del vendedor > Mis referidos"
    echo "  - Dashboard del vendedor > Citas de valuación (si aplica)"
    echo ""
    echo "Inicia sesión como seller con UUID: $REFERRER_UUID"
    echo "y navega a /admin/seller para ver las vistas."
else
    echo "   ERROR - HTTP $HTTP_CODE"
    echo "   Respuesta: $APPOINTMENT_BODY"
    exit 1
fi
