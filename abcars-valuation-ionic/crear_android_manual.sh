#!/bin/bash

# Script para crear proyecto Android manualmente sin Capacitor CLI

echo "=== Creando proyecto Android manualmente ==="

PROJECT_DIR="$(pwd)"
ANDROID_DIR="$PROJECT_DIR/android"

if [ -d "$ANDROID_DIR" ]; then
    echo "⚠️  La carpeta android ya existe"
    exit 1
fi

echo "1. Creando estructura de directorios..."
mkdir -p "$ANDROID_DIR/app/src/main/assets"
mkdir -p "$ANDROID_DIR/app/src/main/java/com/abcars/valuation"
mkdir -p "$ANDROID_DIR/app/src/main/res/values"
mkdir -p "$ANDROID_DIR/app/src/main/res/mipmap-mdpi"
mkdir -p "$ANDROID_DIR/app/src/main/res/mipmap-hdpi"
mkdir -p "$ANDROID_DIR/app/src/main/res/mipmap-xhdpi"
mkdir -p "$ANDROID_DIR/app/src/main/res/mipmap-xxhdpi"
mkdir -p "$ANDROID_DIR/app/src/main/res/mipmap-xxxhdpi"

echo "2. Copiando web assets..."
cp -r "$PROJECT_DIR/dist/"* "$ANDROID_DIR/app/src/main/assets/"

echo "3. Creando AndroidManifest.xml..."
cat > "$ANDROID_DIR/app/src/main/AndroidManifest.xml" << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.abcars.valuation">
    
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    
    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="ABCars Valuación"
        android:theme="@style/AppTheme"
        android:usesCleartextTraffic="true">
        
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|screenSize|keyboardHidden">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
EOF

echo "4. Creando strings.xml..."
cat > "$ANDROID_DIR/app/src/main/res/values/strings.xml" << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">ABCars Valuación</string>
</resources>
EOF

echo "✅ Estructura básica creada"
echo ""
echo "⚠️  IMPORTANTE: Necesitas:"
echo "   1. Abrir Android Studio"
echo "   2. Importar este proyecto (File → Open → android/)"
echo "   3. Configurar Gradle automáticamente"
echo "   4. Configurar el icono desde resources/icon.png"
echo "   5. Build → Build APK(s)"
echo ""
echo "O instalar Node 22+ y usar: npx cap add android"

