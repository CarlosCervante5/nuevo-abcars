<?php

namespace App\Http\Controllers\Analytics;

use App\Http\Controllers\Controller;
use App\Models\Vehicle;
use App\Models\VehicleBrand;
use App\Models\BrandLine;
use App\Models\Dealership;
use App\Models\CustomerAppointment;
use App\Models\Leads\AskInformation;
use App\Models\Valuations\VehicleValuation;
use App\Models\VehicleUpdate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Carbon\Carbon;

class AdminAnalyticsDashboardController extends Controller
{
    /**
     * Extract and validate common filters from the request.
     */
    private function getFilters(Request $request): array
    {
        $startDate = $request->query('start_date')
            ? Carbon::parse($request->query('start_date'))->startOfDay()
            : Carbon::today()->subDays(30)->startOfDay();

        $endDate = $request->query('end_date')
            ? Carbon::parse($request->query('end_date'))->endOfDay()
            : Carbon::today()->endOfDay();

        // Validate max range of 90 days
        if ($startDate->diffInDays($endDate) > 90) {
            abort(422, 'El rango máximo es de 90 días');
        }

        $dealershipId = $request->query('dealership_id');

        if ($dealershipId) {
            $exists = Dealership::where('id', $dealershipId)->whereNull('deleted_at')->exists();
            if (!$exists) {
                abort(422, 'Sucursal no encontrada');
            }
        }

        return [
            'start_date' => $startDate,
            'end_date' => $endDate,
            'dealership_id' => $dealershipId ? (int) $dealershipId : null,
        ];
    }

    /**
     * Return list of active dealerships.
     */
    public function dealerships(): JsonResponse
    {
        try {
            $dealerships = Dealership::whereNull('deleted_at')
                ->select('id', 'name', 'location')
                ->orderBy('name')
                ->get();

            return response()->json([
                'data' => $dealerships,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'message' => 'Error al procesar la solicitud',
            ], 500);
        }
    }

    /**
     * Top sold vehicles grouped by brand name.
     */
    public function topSold(Request $request): JsonResponse
    {
        try {
            $filters = $this->getFilters($request);

            $query = Vehicle::query()
                ->join(
                    (new VehicleBrand)->getTable() . ' as vb',
                    'vb.id', '=', (new Vehicle)->getTable() . '.brand_id'
                )
                ->where((new Vehicle)->getTable() . '.page_status', 'sold')
                ->whereBetween((new Vehicle)->getTable() . '.updated_at', [
                    $filters['start_date'],
                    $filters['end_date'],
                ]);

            if ($filters['dealership_id']) {
                $query->where((new Vehicle)->getTable() . '.dealership_id', $filters['dealership_id']);
            }

            $results = $query
                ->selectRaw('vb.name as brand_name, COUNT(*) as total_sold')
                ->groupBy('vb.name')
                ->orderByDesc('total_sold')
                ->limit(10)
                ->get();

            return response()->json([
                'data' => $results,
                'filters' => [
                    'start_date' => $filters['start_date']->toDateString(),
                    'end_date' => $filters['end_date']->toDateString(),
                    'dealership_id' => $filters['dealership_id'],
                ],
            ]);
        } catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) {
            return response()->json([
                'error' => true,
                'message' => $e->getMessage(),
            ], $e->getStatusCode());
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'message' => 'Error al procesar la solicitud',
            ], 500);
        }
    }

    /**
     * Recently sold vehicles.
     */
    public function recentSold(Request $request): JsonResponse
    {
        try {
            $filters = $this->getFilters($request);

            $vehiclesTable = (new Vehicle)->getTable();
            $brandsTable = (new VehicleBrand)->getTable();
            $dealershipsTable = (new Dealership)->getTable();

            $query = Vehicle::query()
                ->join($brandsTable . ' as vb', 'vb.id', '=', $vehiclesTable . '.brand_id')
                ->leftJoin($dealershipsTable . ' as d', 'd.id', '=', $vehiclesTable . '.dealership_id')
                ->where($vehiclesTable . '.page_status', 'sold')
                ->whereBetween($vehiclesTable . '.updated_at', [
                    $filters['start_date'],
                    $filters['end_date'],
                ]);

            if ($filters['dealership_id']) {
                $query->where($vehiclesTable . '.dealership_id', $filters['dealership_id']);
            }

            $results = $query
                ->select(
                    $vehiclesTable . '.name as vehicle_name',
                    'vb.name as brand_name',
                    $vehiclesTable . '.sale_price',
                    'd.name as dealership_name',
                    $vehiclesTable . '.updated_at as sold_date'
                )
                ->orderByDesc($vehiclesTable . '.updated_at')
                ->limit(20)
                ->get();

            return response()->json([
                'data' => $results,
                'filters' => [
                    'start_date' => $filters['start_date']->toDateString(),
                    'end_date' => $filters['end_date']->toDateString(),
                    'dealership_id' => $filters['dealership_id'],
                ],
            ]);
        } catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) {
            return response()->json([
                'error' => true,
                'message' => $e->getMessage(),
            ], $e->getStatusCode());
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'message' => 'Error al procesar la solicitud',
            ], 500);
        }
    }

    /**
     * Most requested vehicles (appointments + ask information).
     */
    public function mostRequested(Request $request): JsonResponse
    {
        try {
            $filters = $this->getFilters($request);

            $appointmentsTable = (new CustomerAppointment)->getTable();

            // Count appointments grouped by dealership_name
            $query = CustomerAppointment::query()
                ->whereNotNull('dealership_name')
                ->whereBetween($appointmentsTable . '.created_at', [
                    $filters['start_date'],
                    $filters['end_date'],
                ]);

            if ($filters['dealership_id']) {
                // Filter by matching dealership name from dealership id
                $dealership = Dealership::find($filters['dealership_id']);
                if ($dealership) {
                    $query->where($appointmentsTable . '.dealership_name', $dealership->name);
                }
            }

            $appointmentCounts = $query
                ->selectRaw('dealership_name, COUNT(*) as appointment_count')
                ->groupBy('dealership_name')
                ->get()
                ->keyBy('dealership_name');

            // Tabla ask_information: migración inicial sin columnas de lead; evitar 500 si aún no se migró
            $askInfoTable = (new AskInformation)->getTable();
            if (! Schema::hasColumn($askInfoTable, 'dealership_name')) {
                $askInfoCounts = collect();
            } else {
                $askQuery = AskInformation::query()
                    ->whereNotNull('dealership_name')
                    ->whereBetween($askInfoTable . '.created_at', [
                        $filters['start_date'],
                        $filters['end_date'],
                    ]);

                if ($filters['dealership_id']) {
                    $dealership = $dealership ?? Dealership::find($filters['dealership_id']);
                    if ($dealership) {
                        $askQuery->where($askInfoTable . '.dealership_name', $dealership->name);
                    }
                }

                $askInfoCounts = $askQuery
                    ->selectRaw('dealership_name, COUNT(*) as ask_info_count')
                    ->groupBy('dealership_name')
                    ->get()
                    ->keyBy('dealership_name');
            }

            // Merge both counts
            $allDealerships = $appointmentCounts->keys()->merge($askInfoCounts->keys())->unique();

            $results = $allDealerships->map(function ($dealershipName) use ($appointmentCounts, $askInfoCounts) {
                $apptRow = $appointmentCounts->get($dealershipName);
                $askRow = $askInfoCounts->get($dealershipName);
                $apptCount = (int) ($apptRow?->appointment_count ?? 0);
                $askCount = (int) ($askRow?->ask_info_count ?? 0);

                return [
                    'dealership_name' => $dealershipName,
                    'appointment_count' => (int) $apptCount,
                    'ask_info_count' => (int) $askCount,
                    'total_requests' => (int) $apptCount + (int) $askCount,
                ];
            })
            ->sortByDesc('total_requests')
            ->take(10)
            ->values();

            return response()->json([
                'data' => $results,
                'filters' => [
                    'start_date' => $filters['start_date']->toDateString(),
                    'end_date' => $filters['end_date']->toDateString(),
                    'dealership_id' => $filters['dealership_id'],
                ],
            ]);
        } catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) {
            return response()->json([
                'error' => true,
                'message' => $e->getMessage(),
            ], $e->getStatusCode());
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'message' => 'Error al procesar la solicitud',
            ], 500);
        }
    }

    /**
     * Most valuated vehicles grouped by dealership.
     */
    public function mostValuated(Request $request): JsonResponse
    {
        try {
            $filters = $this->getFilters($request);

            $valuationsTable = (new VehicleValuation)->getTable();
            $appointmentsTable = (new CustomerAppointment)->getTable();

            $query = VehicleValuation::query()
                ->join(
                    $appointmentsTable . ' as ca',
                    'ca.id', '=', $valuationsTable . '.appointment_id'
                )
                ->whereNotNull('ca.dealership_name')
                ->whereBetween($valuationsTable . '.created_at', [
                    $filters['start_date'],
                    $filters['end_date'],
                ]);

            if ($filters['dealership_id']) {
                $query->where($valuationsTable . '.dealership_id', $filters['dealership_id']);
            }

            $results = $query
                ->selectRaw('ca.dealership_name, COUNT(*) as total_valuations, AVG(' . $valuationsTable . '.final_offer) as avg_final_offer')
                ->groupBy('ca.dealership_name')
                ->orderByDesc('total_valuations')
                ->limit(10)
                ->get();

            return response()->json([
                'data' => $results,
                'filters' => [
                    'start_date' => $filters['start_date']->toDateString(),
                    'end_date' => $filters['end_date']->toDateString(),
                    'dealership_id' => $filters['dealership_id'],
                ],
            ]);
        } catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) {
            return response()->json([
                'error' => true,
                'message' => $e->getMessage(),
            ], $e->getStatusCode());
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'message' => 'Error al procesar la solicitud',
            ], 500);
        }
    }

    /**
     * Vehicles with longest time in inventory.
     */
    public function longestInventory(Request $request): JsonResponse
    {
        try {
            $filters = $this->getFilters($request);

            $vehiclesTable = (new Vehicle)->getTable();
            $brandsTable = (new VehicleBrand)->getTable();
            $dealershipsTable = (new Dealership)->getTable();

            $query = Vehicle::query()
                ->join($brandsTable . ' as vb', 'vb.id', '=', $vehiclesTable . '.brand_id')
                ->leftJoin($dealershipsTable . ' as d', 'd.id', '=', $vehiclesTable . '.dealership_id')
                ->where($vehiclesTable . '.page_status', '!=', 'sold')
                ->whereNull($vehiclesTable . '.deleted_at');

            if ($filters['dealership_id']) {
                $query->where($vehiclesTable . '.dealership_id', $filters['dealership_id']);
            }

            $vehicles = $query
                ->select(
                    $vehiclesTable . '.name as vehicle_name',
                    'vb.name as brand_name',
                    $vehiclesTable . '.list_price',
                    'd.name as dealership_name',
                    $vehiclesTable . '.purchase_date',
                    $vehiclesTable . '.created_at'
                )
                ->get();

            // Calculate days using Carbon for portability
            $now = Carbon::now();
            $results = $vehicles->map(function ($vehicle) use ($now) {
                $referenceDate = $vehicle->purchase_date
                    ? Carbon::parse($vehicle->purchase_date)
                    : Carbon::parse($vehicle->created_at);

                return [
                    'vehicle_name' => $vehicle->vehicle_name,
                    'brand_name' => $vehicle->brand_name,
                    'days_in_inventory' => (int) $referenceDate->diffInDays($now),
                    'list_price' => $vehicle->list_price,
                    'dealership_name' => $vehicle->dealership_name,
                ];
            })
            ->sortByDesc('days_in_inventory')
            ->take(15)
            ->values();

            return response()->json([
                'data' => $results,
                'filters' => [
                    'start_date' => $filters['start_date']->toDateString(),
                    'end_date' => $filters['end_date']->toDateString(),
                    'dealership_id' => $filters['dealership_id'],
                ],
            ]);
        } catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) {
            return response()->json([
                'error' => true,
                'message' => $e->getMessage(),
            ], $e->getStatusCode());
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'message' => 'Error al procesar la solicitud',
            ], 500);
        }
    }

    /**
     * Price history from VehicleUpdate records.
     */
    public function priceHistory(Request $request): JsonResponse
    {
        try {
            $filters = $this->getFilters($request);
            $vehicleId = $request->query('vehicle_id');

            $updatesTable = (new VehicleUpdate)->getTable();

            $query = VehicleUpdate::query()
                ->whereBetween($updatesTable . '.created_at', [
                    $filters['start_date'],
                    $filters['end_date'],
                ]);

            if ($vehicleId) {
                $query->where($updatesTable . '.vehicle_id', $vehicleId);
            }

            $updates = $query
                ->select(
                    $updatesTable . '.replaced_json',
                    $updatesTable . '.request_json',
                    $updatesTable . '.created_at',
                    $updatesTable . '.vehicle_id'
                )
                ->orderBy($updatesTable . '.created_at')
                ->get();

            $priceFields = ['sale_price', 'list_price', 'offer_price'];

            // Filter only records that contain price changes
            $priceChanges = $updates->filter(function ($update) use ($priceFields) {
                $replaced = is_string($update->replaced_json)
                    ? json_decode($update->replaced_json, true)
                    : $update->replaced_json;
                $requested = is_string($update->request_json)
                    ? json_decode($update->request_json, true)
                    : $update->request_json;

                if (!is_array($replaced) && !is_array($requested)) {
                    return false;
                }

                foreach ($priceFields as $field) {
                    if ((is_array($replaced) && array_key_exists($field, $replaced)) ||
                        (is_array($requested) && array_key_exists($field, $requested))) {
                        return true;
                    }
                }

                return false;
            });

            if ($vehicleId) {
                // Individual vehicle history
                $changes = $priceChanges->map(function ($update) use ($priceFields) {
                    $replaced = is_string($update->replaced_json)
                        ? json_decode($update->replaced_json, true)
                        : $update->replaced_json;
                    $requested = is_string($update->request_json)
                        ? json_decode($update->request_json, true)
                        : $update->request_json;

                    $change = [
                        'date' => Carbon::parse($update->created_at)->toDateString(),
                    ];

                    foreach ($priceFields as $field) {
                        $oldVal = is_array($replaced) && isset($replaced[$field]) ? $replaced[$field] : null;
                        $newVal = is_array($requested) && isset($requested[$field]) ? $requested[$field] : null;
                        $change['old_' . $field] = $oldVal;
                        $change['new_' . $field] = $newVal;
                    }

                    return $change;
                })->values();

                return response()->json([
                    'data' => $changes,
                    'filters' => [
                        'start_date' => $filters['start_date']->toDateString(),
                        'end_date' => $filters['end_date']->toDateString(),
                        'dealership_id' => $filters['dealership_id'],
                        'vehicle_id' => (int) $vehicleId,
                    ],
                ]);
            }

            // Aggregate: group by date, calculate averages
            $grouped = $priceChanges->groupBy(function ($update) {
                return Carbon::parse($update->created_at)->toDateString();
            });

            $data = $grouped->map(function ($dayUpdates, $date) use ($priceFields) {
                $point = ['date' => $date];

                foreach ($priceFields as $field) {
                    $values = $dayUpdates->map(function ($update) use ($field) {
                        $requested = is_string($update->request_json)
                            ? json_decode($update->request_json, true)
                            : $update->request_json;

                        return is_array($requested) && isset($requested[$field])
                            ? (float) $requested[$field]
                            : null;
                    })->filter()->values();

                    $point['avg_' . $field] = $values->count() > 0
                        ? round($values->avg(), 2)
                        : null;
                }

                return $point;
            })->sortKeys()->values();

            return response()->json([
                'data' => $data,
                'filters' => [
                    'start_date' => $filters['start_date']->toDateString(),
                    'end_date' => $filters['end_date']->toDateString(),
                    'dealership_id' => $filters['dealership_id'],
                ],
            ]);
        } catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) {
            return response()->json([
                'error' => true,
                'message' => $e->getMessage(),
            ], $e->getStatusCode());
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'message' => 'Error al procesar la solicitud',
            ], 500);
        }
    }
}
