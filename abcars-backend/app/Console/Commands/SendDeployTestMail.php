<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

class SendDeployTestMail extends Command
{
    protected $signature = 'mail:send-deploy-test
                            {--to= : Sobrescribe el destinatario (si no, usa MAIL_DEPLOY_TEST_TO desde config)}';

    protected $description = 'Envía un correo de prueba usando la config MAIL_* (para validar SMTP en Railway)';

    public function handle(): int
    {
        $to = trim((string) ($this->option('to') ?: config('services.deploy_mail_test.to', '')));

        if ($to === '') {
            $this->error('Defina MAIL_DEPLOY_TEST_TO en variables de entorno o pase --to=correo@dominio.com');

            return self::FAILURE;
        }

        $body = sprintf(
            "Prueba de correo desde deploy (Railway).\nAPP_ENV=%s\nFecha UTC: %s\n",
            config('app.env'),
            now()->toIso8601String()
        );

        try {
            Mail::raw($body, function ($message) use ($to) {
                $message->to($to)->subject('ABcars — prueba SMTP deploy');
            });
            $this->info("Correo de prueba enviado a: {$to}");

            return self::SUCCESS;
        } catch (\Throwable $e) {
            $this->error('Fallo al enviar: '.$e->getMessage());

            return self::FAILURE;
        }
    }
}
