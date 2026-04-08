<?php

namespace App\Http\Controllers\Seller;

use App\Http\Controllers\Controller;
use App\Models\CustomerAppointment;
use App\Models\Valuations\VehicleValuation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Carbon\Carbon;

class SellerReferralController extends Controller
{
    public function stats(Request $request): JsonResponse
    {
        try {
            $user = auth()->user();
            if (!$user || !$user->hasRole('seller')) {
                return response()->json(['status' => 403, 'message' => 'No autorizado'], 403);
            }

            $sellerId = $user->id;

            $totalReferrals = CustomerAppointment::where('referrer_user_id', $sellerId)->count();

            $monthReferrals = CustomerAppointment::where('referrer_user_id', $sellerId)
                ->whereMonth('created_at', Carbon::now()->month)
                ->whereYear('created_at', Carbon::now()->year)
                ->count();

            $convertedReferrals = CustomerAppointment::where('referrer_user_id', $sellerId)
                ->whereHas('valuation', function ($q) {
                    $q->where('status', 'completed');
                })
                ->count();

            return response()->json([
                'status' => 200,
                'message' => 'OK',
                'data' => [
                    'total_referrals' => $totalReferrals,
                    'month_referrals' => $monthReferrals,
                    'converted_referrals' => $convertedReferrals,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Error al obtener estadísticas',
            ], 500);
        }
    }
}
