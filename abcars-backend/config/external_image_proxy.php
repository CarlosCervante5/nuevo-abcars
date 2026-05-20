<?php

/**
 * Proxy seguro de imágenes externas (p. ej. CloudFront) para el panel marketing:
 * el navegador llama al API con token; el servidor descarga la URL y devuelve bytes.
 *
 * Hosts permitidos: lista separada por comas de patrones para fnmatch(), p. ej.
 * *.cloudfront.net,res.cloudinary.com,intelimotor.s3.amazonaws.com
 */
$defaultPatterns = '*.cloudfront.net,*.cloudinary.com,res.cloudinary.com,intelimotor.s3.amazonaws.com,intelimotor.s3.*.amazonaws.com';
$fromEnv = env('EXTERNAL_IMAGE_PROXY_ALLOWED_HOSTS');
$raw = ($fromEnv === null || trim((string) $fromEnv) === '') ? $defaultPatterns : (string) $fromEnv;

return [
    'allowed_host_patterns' => array_values(array_filter(array_map(
        'trim',
        explode(',', $raw)
    ))),
];
