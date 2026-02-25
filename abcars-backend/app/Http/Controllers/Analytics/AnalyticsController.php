<?php

namespace App\Http\Controllers\Analytics;

use App\Http\Controllers\Controller;
use App\Models\Analytics\FormSubmission;
use App\Models\Analytics\PageView;
use App\Models\Valuations\VehicleValuation;
use App\Models\CustomerAppointment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AnalyticsController extends Controller
{
    /**
     * Registrar una visita de página (puede ser llamada sin auth desde el frontend)
     */
    public function trackPageView(Request $request)
    {
        $validated = $request->validate([
            'path' => 'required|string|max:500',
            'referrer' => 'nullable|string|max:500',
        ]);

        PageView::create([
            'path' => $validated['path'],
            'referrer' => $validated['referrer'] ?? null,
            'user_agent' => $request->userAgent(),
            'ip' => $request->ip(),
            'session_id' => $request->header('X-Session-Id'),
            'view_date' => Carbon::today(),
        ]);

        return response()->json(['status' => 'ok'], 201);
    }

    /**
     * Obtener estadísticas de analytics (requiere auth admin)
     */
    public function getStats(Request $request)
    {
        $days = min(90, max(7, (int) ($request->query('days', 30))));
        $startDate = Carbon::today()->subDays($days);

        // Visitas por día
        $pageViewsByDay = PageView::where('view_date', '>=', $startDate)
            ->select(DB::raw('view_date as date'), DB::raw('COUNT(*) as total'))
            ->groupBy('view_date')
            ->orderBy('view_date')
            ->get();

        // Visitas totales
        $totalPageViews = PageView::where('view_date', '>=', $startDate)->count();

        // Visitas únicas por sesión (aproximado)
        $uniqueSessions = PageView::where('view_date', '>=', $startDate)
            ->whereNotNull('session_id')
            ->distinct()
            ->count('session_id');

        // Formularios enviados por tipo
        $formSubmissionsByType = FormSubmission::where('created_at', '>=', $startDate)
            ->select('form_type', DB::raw('COUNT(*) as total'))
            ->groupBy('form_type')
            ->get()
            ->pluck('total', 'form_type');

        // Formularios por día
        $formsByDay = FormSubmission::where('created_at', '>=', $startDate)
            ->select(DB::raw('DATE(created_at) as date'), DB::raw('COUNT(*) as total'))
            ->groupBy(DB::raw('DATE(created_at)'))
            ->orderBy('date')
            ->get();

        // Valuaciones (desde vehicle_valuations)
        $valuationsCount = VehicleValuation::where('created_at', '>=', $startDate)->count();

        // Citas (desde customer_appointments)
        $appointmentsCount = CustomerAppointment::where('created_at', '>=', $startDate)->count();

        return response()->json([
            'period_days' => $days,
            'start_date' => $startDate->toDateString(),
            'page_views' => [
                'total' => $totalPageViews,
                'unique_sessions' => $uniqueSessions,
                'by_day' => $pageViewsByDay,
            ],
            'form_submissions' => [
                'total' => FormSubmission::where('created_at', '>=', $startDate)->count(),
                'by_type' => $formSubmissionsByType,
                'by_day' => $formsByDay,
            ],
            'valuations' => [
                'total' => $valuationsCount,
            ],
            'appointments' => [
                'total' => $appointmentsCount,
            ],
        ]);
    }
}
