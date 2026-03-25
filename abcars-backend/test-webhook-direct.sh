#!/bin/bash

# Script para probar directamente el webhook de Google Sheets

WEBHOOK_URL="https://script.google.com/macros/s/AKfycby6Bwqp5RI2o6QkcEcxaCvDUai3AFjXi3fgrkYmf3emm9InTRZQk6ZD833YFzNtCbc/exec"

echo "=========================================="
echo "Prueba Directa del Webhook de Google Sheets"
echo "=========================================="
echo ""

# Test 1: Financiamiento
echo "1. Probando Financiamiento..."
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "formType=financing&fecha=2024-12-15 10:30:00&nombre=Juan Pérez&apellido=García&telefono=7771234567&correo=juan.perez@test.com&marca=BMW&modelo=X5&año=2021&precio_vehiculo=1850000&enganche=555000&mensualidad=35000&plazo_meses=48&comentarios=Test de financiamiento" \
  -w "\nStatus: %{http_code}\n" \
  -v 2>&1 | grep -E "(Status|HTTP|success|error)" || echo "Response received"
echo ""
echo ""

# Test 2: Prueba de Manejo
echo "2. Probando Prueba de Manejo..."
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "formType=testDrive&fecha=2024-12-15 10:31:00&nombre=María López&telefono=7779876543&correo=maria.lopez@test.com&fecha_preferida=2024-12-20&hora_preferida=2:00 PM&marca=Mercedes-Benz&modelo=C300&año=2022&comentarios=Test de prueba de manejo" \
  -w "\nStatus: %{http_code}\n" \
  -s
echo ""
echo ""

# Test 3: Oferta
echo "3. Probando Oferta..."
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "formType=offer&fecha=2024-12-15 10:32:00&nombre=Carlos Rodríguez&telefono=7775551234&correo=carlos.rodriguez@test.com&monto_ofrecido=1650000&marca=Porsche&modelo=911 GT3&año=2021&comentarios=Test de oferta" \
  -w "\nStatus: %{http_code}\n" \
  -s
echo ""
echo ""

# Test 4: Valuación
echo "4. Probando Valuación..."
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "formType=valuation&fecha=2024-12-15 10:33:00&nombre=Ana Martínez&apellido=Sánchez&telefono=7774447890&correo=ana.martinez@test.com&marca=Audi&modelo=A4&año=2019&kilometraje=45000&comentarios=Test de valuación" \
  -w "\nStatus: %{http_code}\n" \
  -s
echo ""
echo ""

echo "=========================================="
echo "Pruebas directas completadas"
echo "Revisa tu Google Sheets para verificar si los datos llegaron"
echo "=========================================="


