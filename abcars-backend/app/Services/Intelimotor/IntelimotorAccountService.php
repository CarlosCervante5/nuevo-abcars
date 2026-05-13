<?php

namespace App\Services\Intelimotor;

use App\Models\IntelimotorAccount;
use Illuminate\Support\Collection;

class IntelimotorAccountService
{
    public function listAccounts(): Collection
    {
        return IntelimotorAccount::query()->orderBy('name')->get();
    }

    public function enabledAccounts(): Collection
    {
        return IntelimotorAccount::query()
            ->where('is_enabled', true)
            ->orderBy('name')
            ->get();
    }

    public function findByUuid(string $uuid): IntelimotorAccount
    {
        $account = IntelimotorAccount::query()->where('uuid', $uuid)->first();

        if (! $account) {
            throw new IntelimotorIntegrationException('Cuenta Intelimotor no encontrada.', 404);
        }

        return $account;
    }

    public function createAccount(array $data): IntelimotorAccount
    {
        $account = new IntelimotorAccount();
        $account->name = trim((string) ($data['name'] ?? 'Cuenta Intelimotor'));
        $account->base_url = rtrim((string) ($data['base_url'] ?? config('services.intelimotor.base_url')), '/');
        $account->is_enabled = (bool) ($data['is_enabled'] ?? true);
        $this->applyCredentials($account, $data);
        $this->applyOptionalFields($account, $data);
        $account->save();

        return $account->fresh();
    }

    public function updateAccount(IntelimotorAccount $account, array $data): IntelimotorAccount
    {
        if (array_key_exists('name', $data) && filled($data['name'])) {
            $account->name = trim((string) $data['name']);
        }

        $this->applyCredentials($account, $data);
        $this->applyOptionalFields($account, $data);
        $account->save();

        return $account->fresh();
    }

    public function deleteAccount(IntelimotorAccount $account): void
    {
        if ($account->id === null) {
            return;
        }

        IntelimotorAccount::query()->whereKey($account->id)->delete();
    }

    private function applyCredentials(IntelimotorAccount $account, array $data): void
    {
        if (array_key_exists('api_key', $data) && filled($data['api_key'])) {
            $account->api_key = $data['api_key'];
        }

        if (array_key_exists('api_secret', $data) && filled($data['api_secret'])) {
            $account->api_secret = $data['api_secret'];
        }

        if ($account->hasCredentials() && ! array_key_exists('is_enabled', $data)) {
            $account->is_enabled = true;
        }
    }

    private function applyOptionalFields(IntelimotorAccount $account, array $data): void
    {
        if (array_key_exists('business_unit_id', $data)) {
            $account->business_unit_id = $data['business_unit_id'] ?: null;
        }

        if (array_key_exists('default_dealership_id', $data)) {
            $account->default_dealership_id = $data['default_dealership_id'] ?: null;
        }

        if (array_key_exists('base_url', $data) && filled($data['base_url'])) {
            $account->base_url = rtrim((string) $data['base_url'], '/');
        }

        if (array_key_exists('is_enabled', $data)) {
            $account->is_enabled = (bool) $data['is_enabled'];
        }
    }
}
