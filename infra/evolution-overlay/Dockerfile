# Overlay Evolution API 2.3.7 + Baileys 7.0.0-rc13
#
# Sin esto, los mensajes salen con status PENDING y se quedan en UNA palomita
# (bug conocido: evolution-api#2638 / #2597).
#
# Railway / Docker:
#   Image build path: infra/evolution-overlay
#   O en docker-compose:
#     build:
#       context: ./infra/evolution-overlay
#       dockerfile: Dockerfile
#
# Después del deploy: volver a vincular QR de la instancia abcars-carwash.

FROM evoapicloud/evolution-api:v2.3.7

WORKDIR /evolution

RUN npm install baileys@7.0.0-rc13 --no-audit --no-fund --save \
  && npm ls baileys --depth=0
