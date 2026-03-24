#!/bin/bash
# Ejecutar solo en deploy Railway cuando quieras validar SMTP desde el mismo entorno que producción/sandbox.
#
# Variables (servicio backend en Railway):
#   RAILWAY_DEPLOY_MAIL_TEST=1     → activa esta prueba al final de init-app.sh
#   MAIL_DEPLOY_TEST_TO=correo@... → destinatario (obligatorio si no usas --to en el comando)
#
set -e

if [ "${RAILWAY_DEPLOY_MAIL_TEST:-}" != "1" ]; then
  echo "[send-deploy-test-mail] Omitido (define RAILWAY_DEPLOY_MAIL_TEST=1 para ejecutar)."
  exit 0
fi

echo "[send-deploy-test-mail] Enviando correo de prueba vía mail:send-deploy-test ..."
php artisan mail:send-deploy-test
echo "[send-deploy-test-mail] OK."
