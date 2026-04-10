<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class StregaManagersSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $role = Role::firstOrCreate(['name' => 'strega-manager']);

        $managers = [
            ['nickname' => 'Carmen', 'email' => 'carmen@vecsa.com', 'password' => 'Carmen%2024%%'],
            ['nickname' => 'Abigail', 'email' => 'abigail@vecsa.com', 'password' => 'Abigail%2024%%'],
            ['nickname' => 'Alondra', 'email' => 'alondra@vecsa.com', 'password' => 'Alondra%2024%%'],
            ['nickname' => 'Carla', 'email' => 'carla@vecsa.com', 'password' => 'Carla%2024%%'],
            ['nickname' => 'Jon', 'email' => 'jon@vecsa.com', 'password' => 'Jon%2024%%'],
        ];

        foreach ($managers as $row) {
            $user = User::firstOrCreate(
                ['email' => $row['email']],
                ['nickname' => $row['nickname'], 'password' => $row['password']]
            );

            if (! $user->hasRole('strega-manager')) {
                $user->assignRole($role);
            }

            if (! $user->userProfile) {
                $user->userProfile()->create([
                    'name' => $row['nickname'],
                    'last_name' => '_',
                ]);
            }
        }
    }
}
