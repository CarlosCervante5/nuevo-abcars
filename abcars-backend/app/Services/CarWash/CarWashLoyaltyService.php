<?php

namespace App\Services\CarWash;

use App\Models\CarWash\CarWashAppointment;
use App\Models\CarWash\CarWashLoyaltyCard;
use App\Models\CarWash\CarWashLoyaltyStamp;
use App\Models\CarWash\CarWashSetting;
use App\Services\CarWash\WhatsApp\CarWashPhoneNormalizer;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class CarWashLoyaltyService
{
    public const SETTING_KEY = 'loyalty';

    public const FILLED_EMOJI = '🛒';

    public const EMPTY_EMOJI = '⬜';

    /**
     * @return array{enabled: bool, slots: int, reward_text: string, stamp_emoji: string, empty_emoji: string}
     */
    public function getSettings(): array
    {
        $defaults = [
            'enabled' => true,
            'slots' => 10,
            'reward_text' => 'Lavado gratis (elige el paquete básico)',
            'stamp_emoji' => self::FILLED_EMOJI,
            'empty_emoji' => self::EMPTY_EMOJI,
        ];

        $stored = CarWashSetting::getJson(self::SETTING_KEY, []);

        return array_merge($defaults, array_filter([
            'enabled' => array_key_exists('enabled', $stored) ? (bool) $stored['enabled'] : null,
            'slots' => isset($stored['slots']) ? max(1, min(20, (int) $stored['slots'])) : null,
            'reward_text' => isset($stored['reward_text']) ? trim((string) $stored['reward_text']) : null,
            'stamp_emoji' => isset($stored['stamp_emoji']) ? trim((string) $stored['stamp_emoji']) : null,
            'empty_emoji' => isset($stored['empty_emoji']) ? trim((string) $stored['empty_emoji']) : null,
        ], fn ($v) => $v !== null && $v !== ''));
    }

    /**
     * @param  array{enabled?: bool, slots?: int, reward_text?: string, stamp_emoji?: string, empty_emoji?: string}  $input
     * @return array{enabled: bool, slots: int, reward_text: string, stamp_emoji: string, empty_emoji: string}
     */
    public function updateSettings(array $input): array
    {
        $current = $this->getSettings();
        $next = [
            'enabled' => array_key_exists('enabled', $input) ? (bool) $input['enabled'] : $current['enabled'],
            'slots' => isset($input['slots']) ? max(1, min(20, (int) $input['slots'])) : $current['slots'],
            'reward_text' => isset($input['reward_text'])
                ? trim((string) $input['reward_text'])
                : $current['reward_text'],
            'stamp_emoji' => isset($input['stamp_emoji']) && trim((string) $input['stamp_emoji']) !== ''
                ? trim((string) $input['stamp_emoji'])
                : $current['stamp_emoji'],
            'empty_emoji' => isset($input['empty_emoji']) && trim((string) $input['empty_emoji']) !== ''
                ? trim((string) $input['empty_emoji'])
                : $current['empty_emoji'],
        ];

        if ($next['reward_text'] === '') {
            $next['reward_text'] = $current['reward_text'];
        }

        CarWashSetting::putJson(self::SETTING_KEY, $next);

        return $this->getSettings();
    }

    public function tablesReady(): bool
    {
        try {
            $prefix = env('DB_TABLE_PREFIX', '');

            return Schema::hasTable($prefix.'carwash_loyalty_cards')
                && Schema::hasTable($prefix.'carwash_loyalty_stamps');
        } catch (\Throwable) {
            return false;
        }
    }

    /**
     * Otorga 1 sello al marcar cita como entregada (asistida). Idempotente por appointment_id.
     *
     * @return array{ok: bool, awarded?: bool, reason?: string, card?: array<string, mixed>}
     */
    public function awardOnDelivered(CarWashAppointment $appointment): array
    {
        if (! $this->tablesReady()) {
            return ['ok' => false, 'reason' => 'loyalty_tables_missing'];
        }

        $settings = $this->getSettings();
        if (! $settings['enabled']) {
            return ['ok' => true, 'awarded' => false, 'reason' => 'disabled'];
        }

        $phone = CarWashPhoneNormalizer::e164((string) $appointment->customer_phone);
        if ($phone === '') {
            return ['ok' => false, 'reason' => 'missing_phone'];
        }

        if (CarWashLoyaltyStamp::query()->where('appointment_id', $appointment->id)->exists()) {
            return ['ok' => true, 'awarded' => false, 'reason' => 'already_stamped', 'card' => $this->cardPayload(
                CarWashLoyaltyCard::query()->where('customer_phone', $phone)->first(),
                $settings
            )];
        }

        try {
            $result = DB::transaction(function () use ($appointment, $phone, $settings) {
                $card = CarWashLoyaltyCard::query()->firstOrCreate(
                    ['customer_phone' => $phone],
                    [
                        'customer_name' => $appointment->customer_name,
                        'stamps_count' => 0,
                        'completed_cycles' => 0,
                    ]
                );

                if ($appointment->customer_name && empty($card->customer_name)) {
                    $card->customer_name = $appointment->customer_name;
                }

                $slots = (int) $settings['slots'];
                $cycle = max(1, (int) $card->completed_cycles + 1);

                CarWashLoyaltyStamp::create([
                    'loyalty_card_id' => $card->id,
                    'appointment_id' => $appointment->id,
                    'cycle_number' => $cycle,
                    'source' => 'delivered',
                ]);

                $card->stamps_count = min($slots, (int) $card->stamps_count + 1);
                $card->last_stamp_at = now();
                $completed = false;

                if ($card->stamps_count >= $slots) {
                    $card->completed_cycles = (int) $card->completed_cycles + 1;
                    $card->stamps_count = 0;
                    $card->reward_ready_at = now();
                    $completed = true;
                }

                $card->save();

                return [
                    'ok' => true,
                    'awarded' => true,
                    'completed_cycle' => $completed,
                    'card' => $this->cardPayload($card->fresh(), $settings),
                ];
            });

            Log::info('CarWash loyalty stamp awarded', [
                'appointment_uuid' => $appointment->uuid,
                'phone' => $phone,
                'stamps' => $result['card']['stamps_count'] ?? null,
                'completed_cycle' => $result['completed_cycle'] ?? false,
            ]);

            return $result;
        } catch (\Throwable $e) {
            Log::warning('CarWash loyalty stamp failed', [
                'appointment_uuid' => $appointment->uuid,
                'error' => $e->getMessage(),
            ]);

            return ['ok' => false, 'reason' => $e->getMessage()];
        }
    }

    /**
     * @return array{ok: bool, enabled?: bool, punch_card?: string, message?: string, error?: string}|array<string, mixed>
     */
    public function lookupByPhone(?string $phone): array
    {
        if (! $this->tablesReady()) {
            return ['ok' => false, 'error' => 'Programa de lealtad aún no disponible.'];
        }

        $settings = $this->getSettings();
        if (! $settings['enabled']) {
            return [
                'ok' => false,
                'enabled' => false,
                'error' => 'El programa de cuponera virtual está desactivado por ahora.',
            ];
        }

        $normalized = CarWashPhoneNormalizer::e164((string) $phone);
        if ($normalized === '') {
            return ['ok' => false, 'error' => 'No pude identificar tu teléfono. Escribe desde WhatsApp o indícalo.'];
        }

        $card = CarWashLoyaltyCard::query()->where('customer_phone', $normalized)->first();
        $payload = $this->cardPayload($card, $settings);

        return array_merge(['ok' => true, 'enabled' => true], $payload, [
            'assistant_instruction' => 'Muestra punch_card exactamente como viene (emojis). Di sellos y recompensa. No inventes números.',
        ]);
    }

    /**
     * @param  array{enabled: bool, slots: int, reward_text: string, stamp_emoji: string, empty_emoji: string}  $settings
     * @return array<string, mixed>
     */
    public function cardPayload(?CarWashLoyaltyCard $card, ?array $settings = null): array
    {
        $settings ??= $this->getSettings();
        $slots = (int) $settings['slots'];
        $stamps = (int) ($card?->stamps_count ?? 0);
        $stamps = max(0, min($slots, $stamps));
        $punch = $this->renderPunchCard($stamps, $slots, $settings['stamp_emoji'], $settings['empty_emoji']);
        $remaining = max(0, $slots - $stamps);

        return [
            'customer_phone' => $card?->customer_phone,
            'customer_name' => $card?->customer_name,
            'stamps_count' => $stamps,
            'slots' => $slots,
            'remaining' => $remaining,
            'completed_cycles' => (int) ($card?->completed_cycles ?? 0),
            'reward_text' => $settings['reward_text'],
            'reward_ready' => $card?->reward_ready_at !== null && $stamps === 0 && (int) ($card->completed_cycles ?? 0) > 0,
            'punch_card' => $punch,
            'punch_card_lines' => $this->renderPunchCardLines($stamps, $slots, $settings['stamp_emoji'], $settings['empty_emoji']),
            'last_stamp_at' => optional($card?->last_stamp_at)?->toIso8601String(),
            'message' => $this->humanMessage($stamps, $slots, $remaining, $settings['reward_text'], $punch, (int) ($card?->completed_cycles ?? 0)),
        ];
    }

    public function renderPunchCard(int $stamps, int $slots, ?string $filled = null, ?string $empty = null): string
    {
        $filled = $filled ?: self::FILLED_EMOJI;
        $empty = $empty ?: self::EMPTY_EMOJI;
        $parts = [];
        for ($i = 0; $i < $slots; $i++) {
            $parts[] = $i < $stamps ? $filled : $empty;
        }

        return implode('', $parts);
    }

    /**
     * @return list<string>
     */
    public function renderPunchCardLines(int $stamps, int $slots, ?string $filled = null, ?string $empty = null): array
    {
        $rowSize = 5;
        $filled = $filled ?: self::FILLED_EMOJI;
        $empty = $empty ?: self::EMPTY_EMOJI;
        $tokens = [];
        for ($i = 0; $i < $slots; $i++) {
            $tokens[] = $i < $stamps ? $filled : $empty;
        }
        $lines = [];
        foreach (array_chunk($tokens, $rowSize) as $chunk) {
            $lines[] = implode(' ', $chunk);
        }

        return $lines;
    }

    private function humanMessage(int $stamps, int $slots, int $remaining, string $reward, string $punch, int $cycles): string
    {
        $lines = [
            'Tu cuponera CarWash ABCars:',
            $punch,
            "Sellos: {$stamps}/{$slots}",
        ];
        if ($remaining > 0) {
            $lines[] = "Te faltan {$remaining} visita(s) para tu recompensa: {$reward}";
        } else {
            $lines[] = "¡Completaste la tarjeta! Recompensa: {$reward}. Pide tu premio en la sede.";
        }
        if ($cycles > 0) {
            $lines[] = "Tarjetas completadas: {$cycles}";
        }

        return implode("\n", $lines);
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function listCards(int $limit = 100): array
    {
        if (! $this->tablesReady()) {
            return [];
        }

        $settings = $this->getSettings();

        return CarWashLoyaltyCard::query()
            ->orderByDesc('last_stamp_at')
            ->orderByDesc('updated_at')
            ->limit($limit)
            ->get()
            ->map(fn (CarWashLoyaltyCard $card) => array_merge(
                ['uuid' => $card->uuid],
                $this->cardPayload($card, $settings)
            ))
            ->all();
    }
}
