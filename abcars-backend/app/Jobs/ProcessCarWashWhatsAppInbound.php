<?php

namespace App\Jobs;

use App\Services\CarWash\WhatsApp\CarWashWhatsAppInboundService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessCarWashWhatsAppInbound implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 2;

    public $backoff = 15;

    /**
     * @param  array{phone: string, body: string, provider_message_id?: string|null, customer_name?: string|null, payload?: array|null, provider?: string|null}  $inbound
     */
    public function __construct(public array $inbound) {}

    public function handle(CarWashWhatsAppInboundService $service): void
    {
        try {
            $service->handle($this->inbound);
        } catch (\Throwable $e) {
            Log::error('ProcessCarWashWhatsAppInbound failed', [
                'message' => $e->getMessage(),
                'phone' => $this->inbound['phone'] ?? null,
            ]);
            throw $e;
        }
    }
}
