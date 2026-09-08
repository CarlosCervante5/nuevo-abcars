<?php

namespace App\Jobs;

use App\Models\CarWash\CarWashNotificationOutbox;
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

    public function handle(WhatsAppGatewayResolver $gateways): void
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
