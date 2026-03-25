#!/bin/bash

# Script para probar los endpoints de formularios de leads
# Asegúrate de que el servidor esté corriendo en http://localhost:8000

BASE_URL="http://localhost:8000/api/leads"

echo "=========================================="
echo "Pruebas de Formularios de Leads"
echo "=========================================="
echo ""

# Test 1: Financiamiento
echo "1. Probando Formulario de Financiamiento..."
curl -X POST "${BASE_URL}/financing" \
  -H "Content-Type: application/json" \
  -H "X-Requested-With: XMLHttpRequest" \
  -d '{
    "name": "Juan Pérez",
    "last_name": "García",
    "phone": "7771234567",
    "email": "juan.perez@example.com",
    "address": "Calle Principal 123, Colonia Centro",
    "occupation": "empresario",
    "monthly_income": "60000+",
    "company": "Empresa ABC",
    "job_tenure": "5+",
    "comments": "Interesado en financiamiento a 48 meses",
    "vehicle_brand": "BMW",
    "vehicle_model": "X5",
    "vehicle_year": 2021,
    "vehicle_price": 1850000,
    "down_payment": 555000,
    "down_payment_percentage": 30,
    "monthly_payment": 35000,
    "term_months": 48,
    "finance_amount": 1295000
  }' \
  -w "\nStatus: %{http_code}\n" \
  -s
echo ""
echo ""

# Test 2: Prueba de Manejo
echo "2. Probando Formulario de Prueba de Manejo..."
curl -X POST "${BASE_URL}/test_drive" \
  -H "Content-Type: application/json" \
  -H "X-Requested-With: XMLHttpRequest" \
  -d '{
    "name": "María López",
    "phone": "7779876543",
    "email": "maria.lopez@example.com",
    "preferred_date": "2024-12-20",
    "preferred_time": "2:00 PM",
    "comments": "Prefiero horario de tarde",
    "vehicle_brand": "Mercedes-Benz",
    "vehicle_model": "C300",
    "vehicle_year": 2022,
    "vehicle_uuid": "3b0c3458-f732-4003-b78e-f9be4c74decb"
  }' \
  -w "\nStatus: %{http_code}\n" \
  -s
echo ""
echo ""

# Test 3: Ofrecer Monto
echo "3. Probando Formulario de Ofrecer Monto..."
curl -X POST "${BASE_URL}/offer" \
  -H "Content-Type: application/json" \
  -H "X-Requested-With: XMLHttpRequest" \
  -d '{
    "name": "Carlos Rodríguez",
    "phone": "7775551234",
    "email": "carlos.rodriguez@example.com",
    "offer_amount": 1650000,
    "payment_conditions": "Contado",
    "comments": "Oferta válida por 7 días",
    "vehicle_brand": "Porsche",
    "vehicle_model": "911 GT3",
    "vehicle_year": 2021,
    "vehicle_uuid": "3b0c3458-f732-4003-b78e-f9be4c74decb"
  }' \
  -w "\nStatus: %{http_code}\n" \
  -s
echo ""
echo ""

# Test 4: Valuación
echo "4. Probando Formulario de Valuación..."
curl -X POST "${BASE_URL}/valuation" \
  -H "Content-Type: application/json" \
  -H "X-Requested-With: XMLHttpRequest" \
  -d '{
    "fullName": "Ana Martínez",
    "lastName": "Sánchez",
    "phone": "7774447890",
    "email": "ana.martinez@example.com",
    "city": "Pachuca",
    "preferredDate": "2024-12-18",
    "preferredTime": "10:00 AM",
    "brand": "Audi",
    "model": "A4",
    "year": 2019,
    "mileage": 45000
  }' \
  -w "\nStatus: %{http_code}\n" \
  -s
echo ""
echo ""

echo "=========================================="
echo "Pruebas completadas"
echo "=========================================="


