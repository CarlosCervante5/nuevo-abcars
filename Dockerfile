# Build del backend Laravel desde monorepo (nuevo-abcars/abcars-backend)
# Railway construye desde la raíz del repo; este Dockerfile copia solo el backend.
FROM php:8.2-cli

RUN apt-get update && apt-get install -y \
    libpng-dev \
    libjpeg-dev \
    libfreetype-dev \
    libzip-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    git \
    curl \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) gd pdo_mysql mbstring xml zip bcmath \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app

# Copiar solo el backend desde la raíz del monorepo
COPY abcars-backend/composer.json abcars-backend/composer.lock ./
RUN composer install --no-dev --optimize-autoloader --no-scripts --no-interaction

COPY abcars-backend/ .
RUN composer run-script post-autoload-dump --no-interaction || true

ENV PORT=8000
EXPOSE 8000
CMD php artisan serve --host=0.0.0.0 --port=${PORT}
