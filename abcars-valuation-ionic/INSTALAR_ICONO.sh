#!/bin/bash

# Script para copiar el icono al proyecto

ICON_SOURCE="/Users/strega/Desktop/abcars/Captura de pantalla 2025-12-12 a la(s) 3.40.06 p.m..png"
ICON_DEST="./resources/icon.png"

echo "Copiando icono..."

if [ -f "$ICON_SOURCE" ]; then
    cp "$ICON_SOURCE" "$ICON_DEST"
    echo "✅ Icono copiado a $ICON_DEST"
    ls -lh "$ICON_DEST"
else
    echo "❌ No se encontró el archivo: $ICON_SOURCE"
    echo "Por favor, copia manualmente el archivo PNG a ./resources/icon.png"
fi

