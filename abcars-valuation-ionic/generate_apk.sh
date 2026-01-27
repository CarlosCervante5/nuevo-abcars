#!/bin/bash

echo "=== Generando APK de ABCars Valuation ==="

# Verificar Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 22 ]; then
    echo "⚠️  Advertencia: Se requiere Node.js >=22.0.0 (actual: $(node -v))"
    echo "Continúe si desea usar Android Studio directamente"
fi

# Construir web assets
echo "1. Construyendo web assets..."
npm run build

# Crear estructura Android si no existe
if [ ! -d "android" ]; then
    echo "2. Creando estructura Android..."
    echo "   Ejecute: npx cap add android (requiere Node 22+)"
    echo "   O importe manualmente en Android Studio"
fi

echo ""
echo "✅ Web assets construidos en ./dist"
echo ""
echo "Próximos pasos:"
echo "1. Abrir Android Studio"
echo "2. Importar proyecto desde ./android"
echo "3. Configurar icono desde resources/icon.png"
echo "4. Build → Build APK(s)"
echo ""
