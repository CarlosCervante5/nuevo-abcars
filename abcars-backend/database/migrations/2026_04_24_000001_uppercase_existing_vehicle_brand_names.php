<?php

use App\Models\VehicleBrand;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Normaliza a mayúsculas los nombres de marca ya existentes
     * (el modelo ahora persiste con mb_strtoupper; antes usaba strtolower).
     */
    public function up(): void
    {
        $table = (new VehicleBrand)->getTable();
        if (! Schema::hasTable($table)) {
            return;
        }
        DB::table($table)
            ->orderBy('id')
            ->whereNotNull('name')
            ->where('name', '!=', '')
            ->orderBy('id')
            ->chunkById(200, function ($rows) use ($table) {
                foreach ($rows as $row) {
                    $upper = mb_strtoupper(trim($row->name), 'UTF-8');
                    if ($upper === $row->name) {
                        continue;
                    }
                    DB::table($table)->where('id', $row->id)->update(['name' => $upper]);
                }
            }, 'id', 'id');
    }

    public function down(): void
    {
        // Irreversible: el formato previo (minúsculas) no es deseable
    }
};
