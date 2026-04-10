<?php

namespace Database\Seeders\Support;

use App\Models\User;

/**
 * Evita violaciones UNIQUE (nickname/email) cuando la base ya tiene usuarios
 * creados manualmente o con otro correo pero mismo nickname.
 */
final class SeededUser
{
    /**
     * @param  array{email: string, nickname: string, password: string}  $attrs
     */
    public static function findExistingOrCreate(array $attrs): User
    {
        $email = $attrs['email'];
        $nickLower = strtolower((string) $attrs['nickname']);
        $password = $attrs['password'];

        $user = User::query()
            ->where(function ($q) use ($email, $nickLower) {
                $q->where('email', $email)
                    ->orWhereRaw('LOWER(nickname) = ?', [$nickLower]);
            })
            ->first();

        if ($user !== null) {
            return $user;
        }

        return User::create([
            'nickname' => $attrs['nickname'],
            'email' => $email,
            'password' => $password,
        ]);
    }
}
