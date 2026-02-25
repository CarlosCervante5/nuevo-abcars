<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Documentación de la API - información de endpoints y base URL
Route::get('/api-docs', function () {
    return response()->json([
        'name' => 'ABCars API',
        'version' => '2.0',
        'base_url' => url('/api'),
        'documentation' => 'Documentación técnica de la API REST de ABCars',
        'endpoints' => [
            'auth' => ['/api/auth/login', '/api/auth/register', '/api/auth/logout', '/api/auth/validate_role'],
            'vehicles' => ['/api/vehicles/search', '/api/vehicles/detail', '/api/vehicles/min_max'],
            'valuations' => ['/api/valuations/detail', '/api/valuations/search', '/api/valuations/update'],
            'leads' => ['/api/leads/ask_information', '/api/leads/financing', '/api/leads/valuation', '/api/leads/test_drive', '/api/leads/offer'],
            'dealerships' => ['/api/dealerships/search'],
            'users' => ['/api/users/search', '/api/users/by_role'],
        ],
        'auth' => 'Bearer token (Sanctum)',
    ], 200, [], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
});
