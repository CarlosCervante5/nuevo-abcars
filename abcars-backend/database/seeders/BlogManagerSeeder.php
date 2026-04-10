<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class BlogManagerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $role = Role::firstOrCreate(['name' => 'blog_manager']);

        $blogUsers = [
            ['email' => 'blog_manager@abcars.mx', 'nickname' => 'blog_manager', 'password' => 'BlogManager%2025%%'],
            ['email' => 'jesus_manager@abcars.mx', 'nickname' => 'jesus_blog', 'password' => 'JesusManager%2025%%'],
            ['email' => 'lupita_manager@abcars.mx', 'nickname' => 'lupita_blog', 'password' => 'LupitaManager%2025%%'],
            ['email' => 'karen_manager@abcars.mx', 'nickname' => 'karen_blog', 'password' => 'KarenManager%2025%%'],
            ['email' => 'antonio_manager@abcars.mx', 'nickname' => 'tono_blog', 'password' => 'AntonioManager%2025%%'],
        ];

        foreach ($blogUsers as $attrs) {
            $user = User::firstOrCreate(
                ['email' => $attrs['email']],
                [
                    'nickname' => $attrs['nickname'],
                    'password' => $attrs['password'],
                ]
            );
            $user->assignRole($role);
        }

    }
}
