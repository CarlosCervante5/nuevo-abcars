# Instrucciones de Deploy - ABCars Frontend

## Archivos Generados
- **Archivo comprimido**: `abcars-nuevo-demo.tar.gz` (~13MB)
- **Ubicación**: `/Users/strega/Desktop/abcars/abcars-frontend/abcars-nuevo-demo.tar.gz`

## Contenido del Build
Los archivos de producción están en: `dist/abcars-frontend/browser/`

### Archivos principales:
- `index.html` - Página principal con base href `/nuevo-demo/`
- `main-IBRQ2VAN.js` - Código principal de la aplicación (550KB)
- `styles-WHUCW2TW.css` - Estilos Tailwind compilados (142KB)
- `scripts-RSBM25NI.js` - Scripts de terceros (191KB)
- `polyfills-EONH2QZO.js` - Polyfills para compatibilidad (34KB)
- `assets/` - Todas las imágenes y recursos

## Instrucciones de Subida al Servidor

1. **Descomprimir el archivo** en el servidor:
   ```bash
   cd /path/to/public_html/
   mkdir nuevo-demo
   cd nuevo-demo
   tar -xzf abcars-nuevo-demo.tar.gz
   ```

2. **Configurar permisos** (si es necesario):
   ```bash
   chmod -R 755 /path/to/public_html/nuevo-demo/
   ```

3. **URL de acceso**:
   - https://sandbox.abcars.mx/nuevo-demo/

## Configuración Incluida

### Base URL
- Configurado para funcionar en `/nuevo-demo/`
- Todas las rutas son relativas a esta base

### API Backend
- Apunta a: `https://sandbox.abcars.mx/api`
- Configurado en `environment.production.ts`

### Funcionalidades Incluidas
- ✅ Página principal con 8 vehículos de prueba
- ✅ Tarjetas publicitarias intercaladas
- ✅ Sección de servicios ABCars
- ✅ Footer profesional completo
- ✅ Páginas de detalle de vehículos
- ✅ Cálculos de financiamiento y contado
- ✅ Diseño responsive optimizado para desktop
- ✅ Migración completa a Tailwind CSS

### Optimizaciones
- Fuentes Google optimizadas
- Imágenes lazy loading
- Bundle minificado y optimizado
- SEO meta tags incluidos
- Analytics y Facebook Pixel configurados

## Notas Importantes
- La aplicación usa imágenes de Unsplash para los vehículos
- Todas las rutas Angular están configuradas para funcionar con el subdirectorio
- El archivo `robots.txt` y `sitemap.xml` están incluidos
- Compatible con navegadores modernos 