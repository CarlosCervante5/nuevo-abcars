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

        $role = Role::create(['name' => 'blog_manager']);

        // Create demo users
        $user = User::factory()->create([
            'nickname' => 'blog_manager',
            'email' => 'blog_manager@abcars.mx',
            'password' => 'BlogManager%2025%%'
        ]);
        $user->assignRole($role);


        // Create demo users
        $user = User::factory()->create([
            'nickname' => 'jesus_blog',
            'email' => 'jesus_manager@abcars.mx',
            'password' => 'JesusManager%2025%%'
        ]);
        $user->assignRole($role);


        // Create demo users
        $user = User::factory()->create([
            'nickname' => 'lupita_blog',
            'email' => 'lupita_manager@abcars.mx',
            'password' => 'LupitaManager%2025%%'
        ]);
        $user->assignRole($role);


        // Create demo users
        $user = User::factory()->create([
            'nickname' => 'karen_blog',
            'email' => 'karen_manager@abcars.mx',
            'password' => 'KarenManager%2025%%'
        ]);
        $user->assignRole($role);

        // Create demo users
        $user = User::factory()->create([
            'nickname' => 'tono_blog',
            'email' => 'antonio_manager@abcars.mx',
            'password' => 'AntonioManager%2025%%'
        ]);

        $user->assignRole($role);
        
    }
}
