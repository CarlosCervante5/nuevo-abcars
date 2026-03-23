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

        $technicians = [
            ['nickname' => 'erick_flores', 'email' => 'erick_flores@abcars.mx', 'password' => 'ErikFlores%2024%%', 'name' => 'Erik', 'last_name' => 'Flores'],
            ['nickname' => 'felix_tolama', 'email' => 'felix_tolama@abcars.mx', 'password' => 'FelixTolama%2024%%', 'name' => 'Felix', 'last_name' => 'Tolama'],
            ['nickname' => 'angel_hernandez', 'email' => 'angel_hernandez@abcars.mx', 'password' => 'AngelFlores%2024%%', 'name' => 'Angel', 'last_name' => 'Hernandez Flores'],
            ['nickname' => 'hernan_cuaya', 'email' => 'hernan_cuaya@abcars.mx', 'password' => 'HernanCuaya%2024%%', 'name' => 'Hernan', 'last_name' => 'Elias Cuaya'],
            ['nickname' => 'francisco_huitzil', 'email' => 'francisco_huitzil@abcars.mx', 'password' => 'FranciscoHuitzil%2024%%', 'name' => 'Francisco', 'last_name' => 'Huitzil'],
            ['nickname' => 'agustin_dominguez', 'email' => 'agustin_dominguez@abcars.mx', 'password' => 'AgustinDominguez%2024%%', 'name' => 'Agustin', 'last_name' => 'Dominguez Sanchez'],
            ['nickname' => 'emmanuel_mora', 'email' => 'emmanuel_mora@abcars.mx', 'password' => 'EmmanuelMora%2024%%', 'name' => 'Emmanuel', 'last_name' => 'Mora Ramirez'],
            ['nickname' => 'israel_perez', 'email' => 'israel_perez@abcars.mx', 'password' => 'IsraelPerez%2024%%', 'name' => 'Israel', 'last_name' => 'Perez Atlatenco'],
            ['nickname' => 'juan_baez', 'email' => 'juan_baez@abcars.mx', 'password' => 'JuanBaez%2024%%', 'name' => 'Juan', 'last_name' => 'Baez Baez'],
            ['nickname' => 'enrique_mendoza', 'email' => 'enrique_mendoza@abcars.mx', 'password' => 'EnriqueMendoza%2024%%', 'name' => 'Enrique', 'last_name' => 'Mendoza,'],
            ['nickname' => 'julio_luna', 'email' => 'julio_luna@abcars.mx', 'password' => 'JulioLuna%2024%%', 'name' => 'Julio', 'last_name' => 'Cesar Luna'],
            ['nickname' => 'miguel_flores', 'email' => 'miguel_flores@abcars.mx', 'password' => 'MiguelFlores%2024%%', 'name' => 'Miguel', 'last_name' => 'Flores'],
            ['nickname' => 'nelson_gonzales', 'email' => 'nelson_gonzales@abcars.mx', 'password' => 'NelsonGonzalez%2024%%', 'name' => 'Nelson', 'last_name' => 'Gonzalez Solano'],
            ['nickname' => 'gustavo_castro', 'email' => 'gustavo_castro@abcars.mx', 'password' => 'GustavoCastro%2024%%', 'name' => 'Gustavo Ores', 'last_name' => 'Castro Romero'],
            ['nickname' => 'jose_calixto', 'email' => 'jose_calixto@abcars.mx', 'password' => 'JoseCalixto%2024%%', 'name' => 'Jose Ismael', 'last_name' => 'Calixto'],
            ['nickname' => 'agustin_zambrano', 'email' => 'agustin_zambrano@abcars.mx', 'password' => 'AgustinZambrano%2024%%', 'name' => 'Agustin', 'last_name' => 'Zambrano Gutierrez'],
            ['nickname' => 'nahum_gonzalez', 'email' => 'nahum_gonzalez@abcars.mx', 'password' => 'NahumGonzalez%2024%%', 'name' => 'Nahum', 'last_name' => 'Torres Gonzalez'],
            ['nickname' => 'israel_gutierrez', 'email' => 'israel_gutierrez@abcars.mx', 'password' => 'IsraelGutierrez%2024%%', 'name' => 'Israel', 'last_name' => 'Gutierrez Galicia'],
            ['nickname' => 'juan_escamilla', 'email' => 'juan_escamilla@abcars.mx', 'password' => 'JuanEscamilla%2024%%', 'name' => 'Juan Manuel', 'last_name' => 'Escamilla Gomez'],
            ['nickname' => 'raul_martinez', 'email' => 'raul_martinez@abcars.mx', 'password' => 'RaulMartinez%2024%%', 'name' => 'Raul', 'last_name' => 'Martinez Islas'],
            ['nickname' => 'rafael_martinez', 'email' => 'rafael_martinez@abcars.mx', 'password' => 'RafaelMartinez%2024%%', 'name' => 'Rafael', 'last_name' => 'Martinez Martinez'],
            ['nickname' => 'abraham_munoz', 'email' => 'abraham_munoz@abcars.mx', 'password' => 'AbrahamMunoz%2024%%', 'name' => 'Abraham', 'last_name' => 'Munoz Garcia'],
            ['nickname' => 'armando_moreno', 'email' => 'armando_moreno@abcars.mx', 'password' => 'ArmandoMoreno%2024%%', 'name' => 'Armando', 'last_name' => 'Moreno Palacios'],
            ['nickname' => 'gustavo_alvarez', 'email' => 'gustavo_alvarez@abcars.mx', 'password' => 'GustavoAlvarez%2024%%', 'name' => 'Gustavo', 'last_name' => 'Alvarez Flores'],
            ['nickname' => 'josellinne_ponce', 'email' => 'josellinne_ponce@abcars.mx', 'password' => 'JosellinnePonce%2024%%', 'name' => 'Josellinne', 'last_name' => 'Ponce'],
            ['nickname' => 'carlos_brito', 'email' => 'carlos_brito@abcars.mx', 'password' => 'CarlosBrito%2024%%', 'name' => 'Carlos Fabian', 'last_name' => 'Brito Guevara'],
            ['nickname' => 'jose_antonio', 'email' => 'jose_antonio@abcars.mx', 'password' => 'JoseAntonio%2024%%', 'name' => 'Jose Antonio', 'last_name' => 'Reyes Ramirez'],
        ];

        foreach ($technicians as $tech) {
            $user = User::firstOrCreate(
                ['email' => $tech['email']],
                ['nickname' => $tech['nickname'], 'password' => $tech['password']]
            );

            if (! $user->hasRole('technician')) {
                $user->assignRole($role);
            }

            if (! $user->userProfile) {
                $user->userProfile()->create([
                    'name' => $tech['name'],
                    'last_name' => $tech['last_name'],
                ]);
            }
        }

    }
}
