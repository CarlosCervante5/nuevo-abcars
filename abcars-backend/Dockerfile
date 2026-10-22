# Railway (root del servicio: abcars-backend). Nixpacks no ofrece PHP 8.5.
FROM php:8.5-cli

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
    && docker-php-ext-install gd pdo_mysql mbstring zip bcmath \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app

COPY composer.json composer.lock ./
# Incluir require-dev (Faker) para seeders que usan Factory.
ENV COMPOSER_MEMORY_LIMIT=-1
RUN composer install --optimize-autoloader --no-scripts --no-interaction

COPY . .
RUN composer run-script post-autoload-dump --no-interaction || true

ENV PORT=8000
EXPOSE 8000
CMD php artisan serve --host=0.0.0.0 --port=${PORT}
