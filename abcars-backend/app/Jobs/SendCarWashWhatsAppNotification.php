<?php

namespace App\Jobs;

use App\Models\CarWash\CarWashAppointment;
use App\Models\CarWash\CarWashNotificationOutbox;
use App\Services\CarWash\WhatsApp\CarWashWhatsAppInboundService;
use App\Services\CarWash\WhatsApp\WhatsAppGatewayResolver;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendCarWashWhatsAppNotification implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 3;

    public $backoff = [30, 120, 300];

    public function __construct(public int $outboxId) {}

    public function handle(WhatsAppGatewayResolver $gateways, CarWashWhatsAppInboundService $whatsapp): void
    {
        $outbox = CarWashNotificationOutbox::query()->find($this->outboxId);
        if (! $outbox || $outbox->status === 'sent') {
            return;
        }

        $outbox->attempts = (int) $outbox->attempts + 1;
        $outbox->status = 'sending';
        $outbox->save();

        $gateway = $gateways->default();
        $result = $gateway->sendText($outbox->to_phone, $outbox->body);

        if ($result['ok'] ?? false) {
            $outbox->status = 'sent';
            $outbox->sent_at = now();
            $outbox->last_error = null;
            $meta = $outbox->meta ?? [];
            $meta['provider'] = $gateway->provider();
            $meta['provider_message_id'] = $result['provider_message_id'] ?? null;
            $outbox->meta = $meta;
            $outbox->save();

            // Misma bandeja admin: persistir en el hilo WhatsApp (sin reenviar).
            try {
                $customerName = null;
                if (! empty($outbox->appointment_id)) {
                    $customerName = CarWashAppointment::query()
                        ->where('id', $outbox->appointment_id)
                        ->value('customer_name');
                }

                $whatsapp->storeOutboundAlreadySent(
                    (string) $outbox->to_phone,
                    (string) $outbox->body,
                    $result['provider_message_id'] ?? null,
                    [
                        'source' => 'status_notification',
                        'provider' => $gateway->provider(),
                        'outbox_id' => $outbox->id,
                        'template_key' => $outbox->template_key,
                        'appointment_uuid' => $meta['appointment_uuid'] ?? null,
                        'to_status' => $meta['to_status'] ?? null,
                    ],
                    $customerName ? (string) $customerName : null,
                );
            } catch (\Throwable $e) {
                Log::warning('CarWash status notification not mirrored to inbox', [
                    'outbox_id' => $outbox->id,
                    'error' => $e->getMessage(),
                ]);
            }

            return;
        }

        $outbox->status = 'failed';
        $outbox->last_error = $result['error'] ?? 'send failed';
        $outbox->save();

        Log::warning('CarWash outbox send failed', [
            'outbox_id' => $outbox->id,
            'error' => $outbox->last_error,
        ]);

        if ($this->attempts() < $this->tries) {
            $outbox->status = 'pending';
            $outbox->save();
            throw new \RuntimeException($outbox->last_error);
        }
    }
}
