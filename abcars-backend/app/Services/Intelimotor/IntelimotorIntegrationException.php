<?php

namespace App\Services\Intelimotor;

use RuntimeException;

class IntelimotorIntegrationException extends RuntimeException
{
    public function __construct(
        string $message,
        private readonly int $status = 422
    ) {
        parent::__construct($message);
    }

    public function status(): int
    {
        return $this->status;
    }
}
