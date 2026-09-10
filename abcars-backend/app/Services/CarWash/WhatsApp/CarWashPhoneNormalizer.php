<?php

namespace App\Services\CarWash\WhatsApp;

class CarWashPhoneNormalizer
{
    /**
     * Normaliza a dígitos (sin +). Útil para Evolution API.
     * México: 10 dígitos locales → 52 + número.
     */
    public static function digits(string $raw): string
    {
        $raw = trim($raw);
        $raw = preg_replace('/^whatsapp:/i', '', $raw) ?? $raw;
        $raw = preg_replace('/@.*$/', '', $raw) ?? $raw;
        $digits = preg_replace('/\D+/', '', $raw) ?? '';

        // MX común: 10 dígitos locales → 52 + número
        if (strlen($digits) === 10) {
            return '52'.$digits;
        }

        return $digits;
    }

    /**
     * Número listo para Evolution / wa.me (México móvil usa 521 + 10 dígitos).
     *
     * WhatsApp México: tras el código de país 52 hay que insertar un "1"
     * antes de los 10 dígitos locales. Sin eso, sendText suele devolver OK
     * pero el mensaje se queda en una sola palomita (no entregado).
     *
     * @see https://faq.whatsapp.com/1294841057948784
     */
    public static function forEvolution(string $raw): string
    {
        $digits = self::digits($raw);
        if ($digits === '') {
            return '';
        }

        // Ya en formato WhatsApp MX: 521 + 10 locales
        if (preg_match('/^521\d{10}$/', $digits)) {
            return $digits;
        }

        // E.164 MX sin el "1" de WhatsApp: 52 + 10 locales
        if (preg_match('/^52\d{10}$/', $digits)) {
            return '521'.substr($digits, 2);
        }

        return $digits;
    }

    /**
     * Formato de almacenamiento (+E.164 / WhatsApp MX).
     */
    public static function e164(string $raw): string
    {
        $digits = self::forEvolution($raw);
        if ($digits === '') {
            return '';
        }

        return '+'.$digits;
    }

    /**
     * Variante MX alternativa (+52… ↔ +521…) para buscar conversaciones existentes.
     */
    public static function mexicoAlternate(string $e164OrDigits): ?string
    {
        $digits = self::digits($e164OrDigits);
        if (preg_match('/^521\d{10}$/', $digits)) {
            return '+52'.substr($digits, 3);
        }
        if (preg_match('/^52\d{10}$/', $digits)) {
            return '+521'.substr($digits, 2);
        }

        return null;
    }

    public static function forTwilio(string $raw): string
    {
        $e164 = self::e164($raw);

        return $e164 === '' ? '' : 'whatsapp:'.$e164;
    }

    /**
     * Extrae el JID/teléfono usable desde un payload Evolution (soporta @lid).
     *
     * @param  array<string, mixed>  $key   data.key del webhook
     * @param  array<string, mixed>  $data  data completo
     */
    public static function fromEvolutionKey(array $key, array $data = []): string
    {
        $remoteJid = (string) ($key['remoteJid'] ?? '');
        $remoteJidAlt = (string) ($key['remoteJidAlt'] ?? '');
        $senderPn = (string) ($key['senderPn'] ?? $data['senderPn'] ?? '');
        $participant = (string) ($key['participant'] ?? '');

        $candidates = [];
        // Preferir número real (PN) cuando el chat viene como LID
        if ($remoteJidAlt !== '') {
            $candidates[] = $remoteJidAlt;
        }
        if ($senderPn !== '') {
            $candidates[] = $senderPn;
        }
        if ($participant !== '' && ! str_contains($participant, '@lid')) {
            $candidates[] = $participant;
        }
        if ($remoteJid !== '' && ! str_contains($remoteJid, '@lid')) {
            $candidates[] = $remoteJid;
        }
        // Último recurso: el remoteJid aunque sea @lid (casi nunca sirve para enviar)
        if ($remoteJid !== '') {
            $candidates[] = $remoteJid;
        }

        foreach ($candidates as $candidate) {
            if (str_contains($candidate, '@g.us') || str_contains($candidate, '@broadcast')) {
                continue;
            }
            $e164 = self::e164($candidate);
            if ($e164 !== '' && ! str_contains($candidate, '@lid')) {
                return $e164;
            }
        }

        foreach ($candidates as $candidate) {
            $e164 = self::e164($candidate);
            if ($e164 !== '') {
                return $e164;
            }
        }

        return '';
    }
}
