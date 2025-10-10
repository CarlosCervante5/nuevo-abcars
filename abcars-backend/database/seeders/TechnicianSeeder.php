<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class TechnicianSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $role = Role::findByName('technician');

        // Create demo users
        $user = User::factory()->create([
            'nickname' => 'erick_flores',
            'email' => 'erick_flores@abcars.mx',
            'password' => 'ErikFlores%2024%%'
        ]);
        
        $user->assignRole($role);
        
        $user->userProfile()->create([
            'name' => 'Erik',
            'last_name' => 'Flores'
        ]);
        
        
        
        $user = User::factory()->create([
            'nickname' => 'felix_tolama',
            'email' => 'felix_tolama@abcars.mx',
            'password' => 'FelixTolama%2024%%'
        ]);
        
        $user->assignRole($role);
        
        $user->userProfile()->create([
            'name' => 'Felix',
            'last_name' => 'Tolama'
        ]);
        
        
        
        $user = User::factory()->create([
            'nickname' => 'angel_hernandez',
            'email' => 'angel_hernandez@abcars.mx',
            'password' => 'AngelFlores%2024%%'
        ]);
        
        $user->assignRole($role);
        
        $user->userProfile()->create([
            'name' => 'Angel',
            'last_name' => 'Hernandez Flores'
        ]);
        
        
        $user = User::factory()->create([
            'nickname' => 'hernan_cuaya',
            'email' => 'hernan_cuaya@abcars.mx',
            'password' => 'HernanCuaya%2024%%'
        ]);
        
        $user->assignRole($role);
        
        $user->userProfile()->create([
            'name' => 'Hernan',
            'last_name' => 'Elias Cuaya'
        ]);
        
        
        
        $user = User::factory()->create([
            'nickname' => 'francisco_huitzil',
            'email' => 'francisco_huitzil@abcars.mx',
            'password' => 'FranciscoHuitzil%2024%%'
        ]);
        
        $user->assignRole($role);
        
        $user->userProfile()->create([
            'name' => 'Francisco',
            'last_name' => 'Huitzil'
        ]);
        
        
        
        $user = User::factory()->create([
            'nickname' => 'agustin_dominguez',
            'email' => 'agustin_dominguez@abcars.mx',
            'password' => 'AgustinDominguez%2024%%'
        ]);
        
        $user->assignRole($role);
        
        $user->userProfile()->create([
            'name' => 'Agustin',
            'last_name' => 'Dominguez Sanchez'
        ]);
        
        
        
        $user = User::factory()->create([
            'nickname' => 'emmanuel_mora',
            'email' => 'emmanuel_mora@abcars.mx',
            'password' => 'EmmanuelMora%2024%%'
        ]);
        
        $user->assignRole($role);
        
        $user->userProfile()->create([
            'name' => 'Emmanuel',
            'last_name' => 'Mora Ramirez'
        ]);
        
        
        
        $user = User::factory()->create([
            'nickname' => 'israel_perez',
            'email' => 'israel_perez@abcars.mx',
            'password' => 'IsraelPerez%2024%%'
        ]);
        
        $user->assignRole($role);
        
        $user->userProfile()->create([
            'name' => 'Israel',
            'last_name' => 'Perez Atlatenco'
        ]);
        
        
        
        $user = User::factory()->create([
            'nickname' => 'juan_baez',
            'email' => 'juan_baez@abcars.mx',
            'password' => 'JuanBaez%2024%%'
        ]);
        
        $user->assignRole($role);
        
        $user->userProfile()->create([
            'name' => 'Juan',
            'last_name' => 'Baez Baez'
        ]);
        
        
        $user = User::factory()->create([
            'nickname' => 'enrique_mendoza',
            'email' => 'enrique_mendoza@abcars.mx',
            'password' => 'EnriqueMendoza%2024%%'
        ]);
        
        $user->assignRole($role);
        
        $user->userProfile()->create([
            'name' => 'Enrique',
            'last_name' => 'Mendoza,'
        ]);
        
        
        
        $user = User::factory()->create([
            'nickname' => 'julio_luna',
            'email' => 'julio_luna@abcars.mx',
            'password' => 'JulioLuna%2024%%'
        ]);
        
        $user->assignRole($role);
        
        $user->userProfile()->create([
            'name' => 'Julio',
            'last_name' => 'Cesar Luna'
        ]);
        
        
        
        $user = User::factory()->create([
            'nickname' => 'miguel_flores',
            'email' => 'miguel_flores@abcars.mx',
            'password' => 'MiguelFlores%2024%%'
        ]);
        
        $user->assignRole($role);
        
        $user->userProfile()->create([
            'name' => 'Miguel',
            'last_name' => 'Flores'
        ]);
        
        
        
        $user = User::factory()->create([
            'nickname' => 'nelson_gonzales',
            'email' => 'nelson_gonzales@abcars.mx',
            'password' => 'NelsonGonzalez%2024%%'
        ]);
        
        $user->assignRole($role);
        
        $user->userProfile()->create([
            'name' => 'Nelson',
            'last_name' => 'Gonzalez Solano'
        ]);
        
        
        
        $user = User::factory()->create([
            'nickname' => 'gustavo_castro',
            'email' => 'gustavo_castro@abcars.mx',
            'password' => 'GustavoCastro%2024%%'
        ]);
        
        $user->assignRole($role);
        
        $user->userProfile()->create([
            'name' => 'Gustavo Ores',
            'last_name' => 'Castro Romero'
        ]);
        
        
        
        $user = User::factory()->create([
            'nickname' => 'jose_calixto',
            'email' => 'jose_calixto@abcars.mx',
            'password' => 'JoseCalixto%2024%%'
        ]);
        
        $user->assignRole($role);
        
        $user->userProfile()->create([
            'name' => 'Jose Ismael',
            'last_name' => 'Calixto'
        ]);
        
        
        
        $user = User::factory()->create([
            'nickname' => 'agustin_zambrano',
            'email' => 'agustin_zambrano@abcars.mx',
            'password' => 'AgustinZambrano%2024%%'
        ]);
        
        $user->assignRole($role);
        
        $user->userProfile()->create([
            'name' => 'Agustin',
            'last_name' => 'Zambrano Gutierrez'
        ]);
        
        
        
        $user = User::factory()->create([
            'nickname' => 'nahum_gonzalez',
            'email' => 'nahum_gonzalez@abcars.mx',
            'password' => 'NahumGonzalez%2024%%'
        ]);
        
        $user->assignRole($role);
        
        $user->userProfile()->create([
            'name' => 'Nahum',
            'last_name' => 'Torres Gonzalez'
        ]);
        
        
        
        $user = User::factory()->create([
            'nickname' => 'israel_gutierrez',
            'email' => 'israel_gutierrez@abcars.mx',
            'password' => 'IsraelGutierrez%2024%%'
        ]);
        
        $user->assignRole($role);
        
        $user->userProfile()->create([
            'name' => 'Israel',
            'last_name' => 'Gutierrez Galicia'
        ]);
        
        
        
        $user = User::factory()->create([
            'nickname' => 'juan_escamilla',
            'email' => 'juan_escamilla@abcars.mx',
            'password' => 'JuanEscamilla%2024%%'
        ]);
        
        $user->assignRole($role);
        
        $user->userProfile()->create([
            'name' => 'Juan Manuel',
            'last_name' => 'Escamilla Gomez'
        ]);
        
        
        
        $user = User::factory()->create([
            'nickname' => 'raul_martinez',
            'email' => 'raul_martinez@abcars.mx',
            'password' => 'RaulMartinez%2024%%'
        ]);
        
        $user->assignRole($role);
        
        $user->userProfile()->create([
            'name' => 'Raul',
            'last_name' => 'Martinez Islas'
        ]);
        
        
        
        $user = User::factory()->create([
            'nickname' => 'rafael_martinez',
            'email' => 'rafael_martinez@abcars.mx',
            'password' => 'RafaelMartinez%2024%%'
        ]);
        
        $user->assignRole($role);
        
        $user->userProfile()->create([
            'name' => 'Rafael',
            'last_name' => 'Martinez Martinez'
        ]);
        
        
        
        $user = User::factory()->create([
            'nickname' => 'abraham_munoz',
            'email' => 'abraham_munoz@abcars.mx',
            'password' => 'AbrahamMunoz%2024%%'
        ]);
        
        $user->assignRole($role);
        
        $user->userProfile()->create([
            'name' => 'Abraham',
            'last_name' => 'Munoz Garcia'
        ]);
        
        
        
        $user = User::factory()->create([
            'nickname' => 'armando_moreno',
            'email' => 'armando_moreno@abcars.mx',
            'password' => 'ArmandoMoreno%2024%%'
        ]);
        
        $user->assignRole($role);
        
        $user->userProfile()->create([
            'name' => 'Armando',
            'last_name' => 'Moreno Palacios'
        ]);
        
        
        
        $user = User::factory()->create([
            'nickname' => 'gustavo_alvarez',
            'email' => 'gustavo_alvarez@abcars.mx',
            'password' => 'GustavoAlvarez%2024%%'
        ]);
        
        $user->assignRole($role);
        
        $user->userProfile()->create([
            'name' => 'Gustavo',
            'last_name' => 'Alvarez Flores'
        ]);
        
        
        
        $user = User::factory()->create([
            'nickname' => 'josellinne_ponce',
            'email' => 'josellinne_ponce@abcars.mx',
            'password' => 'JosellinnePonce%2024%%'
        ]);
        
        $user->assignRole($role);
        
        $user->userProfile()->create([
            'name' => 'Josellinne',
            'last_name' => 'Ponce'
        ]);
        
        
        
        $user = User::factory()->create([
            'nickname' => 'carlos_brito',
            'email' => 'carlos_brito@abcars.mx',
            'password' => 'CarlosBrito%2024%%'
        ]);
        
        $user->assignRole($role);
        
        $user->userProfile()->create([
            'name' => 'Carlos Fabian',
            'last_name' => 'Brito Guevara'
        ]);
        
        
        
        $user = User::factory()->create([
            'nickname' => 'jose_antonio',
            'email' => 'jose_antonio@abcars.mx',
            'password' => 'JoseAntonio%2024%%'
        ]);
        
        $user->assignRole($role);
        
        $user->userProfile()->create([
            'name' => 'Jose Antonio',
            'last_name' => 'Reyes Ramirez'
        ]);

    }
}
