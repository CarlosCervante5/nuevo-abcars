<?php

namespace App\Helpers;

use Illuminate\Support\Facades\Http;

class GoogleSheetHelper
{
    /**
     * Enviar datos a Zappier.
     *
     * @param string $webhookUrl La URL del webhook del spreadsheet.
     * @param array ...$dataArrays Arreglos de datos a enviar.
     * @return bool
     */
    public static function sendToGoogleSheet(string $webhookUrl, array ...$dataArrays)
    {
        try {
            // Combina todos los arreglos de datos en uno solo
            $row = array_merge(...$dataArrays);

            // Enviar los datos a Google Sheets mediante HTTP POST
            // Google Apps Script acepta redirects (302), así que seguimos redirects
            $response = Http::asForm()
                ->withOptions(['allow_redirects' => true])
                ->timeout(30)
                ->post($webhookUrl, $row);

            // Log del resultado completo
            $responseBody = $response->body();
            $decodedBody = json_decode($responseBody, true);
            
            \Log::info('Google Sheets webhook response', [
                'url' => $webhookUrl,
                'status' => $response->status(),
                'success' => $response->successful(),
                'body' => $responseBody,
                'decoded' => $decodedBody
            ]);

            // Google Apps Script puede devolver 200 o 302, ambos son válidos
            return $response->status() === 200 || $response->status() === 302;
        } catch (\Exception $e) {
            \Log::error('Error sending to Google Sheets', [
                'url' => $webhookUrl,
                'error' => $e->getMessage(),
                'data' => $dataArrays
            ]);
            return false;
        }
    }

    /**
     * Obtener la URL del webhook desde el .env.
     *
     * @param string $key La clave de la variable de entorno.
     * @return string|null
     */
    public static function getWebhookUrl(string $key)
    {
        return env($key);
    }
}
