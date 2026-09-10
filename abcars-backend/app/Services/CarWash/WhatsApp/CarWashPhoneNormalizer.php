<?php

namespace App\Services\CarWash\WhatsApp;

class CarWashPhoneNormalizer
{
    /**
     * Normaliza a dígitos (sin +). Conserva el JID exacto de WhatsApp.
     * México: solo si llegan 10 dígitos locales → antepone 52.
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
     * Destino para Evolution sendText: dígitos exactos del JID (sin reescribir 521).
     * Forzar 521 rompe contactos cuyo remoteJidAlt ya viene como 52XXXXXXXXXX.
     */
    public static function forEvolution(string $raw): string
    {
        return self::digits($raw);
    }

    /**
     * Solo para links públicos wa.me (México móvil suele requerir 521 en click-to-chat).
     */
    public static function forWhatsAppLink(string $raw): string
    {
        $digits = self::digits($raw);
        if ($digits === '') {
            return '';
        }

        if (preg_match('/^521\d{10}$/', $digits)) {
            return $digits;
        }

        if (preg_match('/^52\d{10}$/', $digits)) {
            return '521'.substr($digits, 2);
        }

        return $digits;
    }

    /**
     * Formato de almacenamiento (+dígitos del JID WhatsApp).
     */
    public static function e164(string $raw): string
    {
        $digits = self::digits($raw);
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
     * True si los dígitos parecen un LID interno y no un teléfono E.164 usable.
     */
    public static function looksLikeLidDigits(string $raw): bool
    {
        $digits = self::digits($raw);
        if ($digits === '') {
            return true;
        }
        // Teléfonos MX típicos: 12 (52+10) o 13 (521+10). LIDs suelen ser más largos.
        if (strlen($digits) >= 14) {
            return true;
        }
        // No empieza con código país conocido corto usado aquí
        if (! str_starts_with($digits, '52') && strlen($digits) > 11) {
            return true;
        }

        return false;
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

        foreach ($candidates as $candidate) {
            if (str_contains($candidate, '@g.us') || str_contains($candidate, '@broadcast')) {
                continue;
            }
            if (str_contains($candidate, '@lid')) {
                continue;
            }
            $e164 = self::e164($candidate);
            if ($e164 !== '' && ! self::looksLikeLidDigits($e164)) {
                return $e164;
            }
        }

        return '';
    }

    /**
     * Extrae LID (@lid) si el mensaje viene en addressingMode=lid.
     *
     * @param  array<string, mixed>  $key
     * @param  array<string, mixed>  $data
     */
    public static function lidFromEvolutionKey(array $key, array $data = []): ?string
    {
        $candidates = [
            (string) ($key['remoteJid'] ?? ''),
            (string) ($key['senderLid'] ?? $data['senderLid'] ?? ''),
            (string) ($data['senderLid'] ?? ''),
        ];

        foreach ($candidates as $candidate) {
            if ($candidate !== '' && str_contains($candidate, '@lid')) {
                return $candidate;
            }
        }

        $mode = strtolower((string) ($key['addressingMode'] ?? $data['addressingMode'] ?? ''));
        $remote = (string) ($key['remoteJid'] ?? '');
        if ($mode === 'lid' && $remote !== '' && ! str_contains($remote, '@')) {
            return $remote.'@lid';
        }

        return null;
    }
}
